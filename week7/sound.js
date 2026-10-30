// =============================================================
//  sound.js — 모든 소리를 Web Audio API로 "직접 합성"합니다.
//  오디오 파일이 하나도 없어서 GitHub Pages에 올려도 바로 동작해요.
//  Sound.xxx() 처럼 점(.)으로 함수를 불러 쓰는 하나의 객체입니다.
// =============================================================

const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12); // MIDI 음 번호 → 주파수(Hz)

const Sound = {
  ctx: null,
  muted: false,
  // BGM 시퀀서 상태
  bpm: 84,
  step: 0,
  nextTime: 0,
  // 계속 켜져 있는 루프 사운드(지글지글, 반죽 붓는 소리)
  sizzleLevel: 0,
  pouring: false,

  // 브라우저는 사용자가 처음 누르기 전에는 소리를 못 내게 막아요.
  // 그래서 첫 버튼 입력 때 init()을 호출합니다.
  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (typeof AC === 'undefined') return; // 아주 오래된 브라우저면 소리 없이 진행
    const ctx = (this.ctx = new AC());

    // 믹서 구조: 각 버스(BGM / 효과음 / 배경 소음) → master → 컴프레서 → 스피커
    this.master = ctx.createGain();
    this.master.gain.value = 0.9;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 3;
    this.master.connect(comp);
    comp.connect(ctx.destination);

    this.bgmBus = this._bus(0.3);
    this.sfxBus = this._bus(0.95);
    this.ambBus = this._bus(0.55);

    // 리버브(울림): 짧게 사라지는 노이즈로 공간감을 만들어요
    this.reverb = ctx.createConvolver();
    this.reverb.buffer = this._impulse(1.8);
    this.reverbSend = ctx.createGain();
    this.reverbSend.gain.value = 0.28;
    this.reverbSend.connect(this.reverb);
    this.reverb.connect(this.master);

    // 2초짜리 화이트 노이즈 — 지글지글, 종이 소리, 드럼 등에 재사용
    const len = ctx.sampleRate * 2;
    this.noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;

    this._startAmbience();
    this._startSizzle();
    this._startPour();
    this._startSqueeze();
    this.nextTime = ctx.currentTime + 0.1;
  },

  _bus(vol) {
    const g = this.ctx.createGain();
    g.gain.value = vol;
    g.connect(this.master);
    return g;
  },

  _impulse(sec) {
    const ctx = this.ctx;
    const len = Math.floor(ctx.sampleRate * sec);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    }
    return buf;
  },

  _noise(loop) {
    const s = this.ctx.createBufferSource();
    s.buffer = this.noiseBuf;
    s.loop = loop;
    return s;
  },

  // ---------- 기본 재료 2가지: 톤(삐/띵)과 노이즈 버스트(칙/착) ----------
  _tone(f, t, dur, o = {}) {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(f, t);
    if (o.glideTo) osc.frequency.exponentialRampToValueAtTime(o.glideTo, t + dur);
    const vol = o.vol || 0.2;
    const atk = o.attack || 0.005;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node = osc;
    if (o.lowpass) {
      const f2 = ctx.createBiquadFilter();
      f2.type = 'lowpass';
      f2.frequency.value = o.lowpass;
      osc.connect(f2);
      node = f2;
    }
    node.connect(g);
    g.connect(o.dest || this.sfxBus);
    if (o.wet) g.connect(this.reverbSend);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  },

  _burst(t, dur, o = {}) {
    const ctx = this.ctx;
    const src = this._noise(false);
    const f = ctx.createBiquadFilter();
    const g = ctx.createGain();
    f.type = o.type || 'bandpass';
    f.frequency.setValueAtTime(o.freq || 1000, t);
    if (o.freqTo) f.frequency.exponentialRampToValueAtTime(o.freqTo, t + dur);
    f.Q.value = o.Q || 1;
    const vol = o.vol || 0.3;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + (o.attack || 0.002));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f);
    f.connect(g);
    g.connect(o.dest || this.sfxBus);
    if (o.wet) g.connect(this.reverbSend);
    src.start(t, Math.random() * 1.5);
    src.stop(t + dur + 0.05);
  },

  // ---------- 항상 돌아가는 루프들 ----------
  _startAmbience() {
    // 멀리서 들리는 길거리 웅웅거림 (저음 노이즈)
    const ctx = this.ctx;
    const src = this._noise(true);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 260;
    const g = ctx.createGain();
    g.gain.value = 0.09;
    src.connect(lp);
    lp.connect(g);
    g.connect(this.ambBus);
    src.start();
  },

  _startSizzle() {
    // 철판 위 지글지글: 높은 대역의 노이즈 + 볼륨을 계속 흔들어 줌
    const ctx = this.ctx;
    const src = this._noise(true);
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 2200;
    const bp = ctx.createBiquadFilter();
    bp.type = 'peaking';
    bp.frequency.value = 6000;
    bp.gain.value = 6;
    this.sizzleGain = ctx.createGain();
    this.sizzleGain.gain.value = 0;
    src.connect(hp);
    hp.connect(bp);
    bp.connect(this.sizzleGain);
    this.sizzleGain.connect(this.sfxBus);
    src.start();
  },

  _startPour() {
    // 반죽 붓는 꿀렁꿀렁 소리: 낮은 노이즈의 필터를 LFO로 흔들기
    const ctx = this.ctx;
    const src = this._noise(true);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 420;
    lp.Q.value = 7;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 6.5;
    const lfoAmt = ctx.createGain();
    lfoAmt.gain.value = 170;
    lfo.connect(lfoAmt);
    lfoAmt.connect(lp.frequency);
    lfo.start();
    this.pourGain = ctx.createGain();
    this.pourGain.gain.value = 0;
    src.connect(lp);
    lp.connect(this.pourGain);
    this.pourGain.connect(this.sfxBus);
    src.start();
  },

  _startSqueeze() {
    // 짤주머니 짜는 소리: 아주 낮고 끈적한 노이즈 + 느린 출렁임
    const ctx = this.ctx;
    const src = this._noise(true);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 240;
    lp.Q.value = 5;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 3.2;
    const lfoAmt = ctx.createGain();
    lfoAmt.gain.value = 110;
    lfo.connect(lfoAmt);
    lfoAmt.connect(lp.frequency);
    lfo.start();
    this.squeezeGain = ctx.createGain();
    this.squeezeGain.gain.value = 0;
    src.connect(lp);
    lp.connect(this.squeezeGain);
    this.squeezeGain.connect(this.sfxBus);
    src.start();
  },

  // ---------- 매 프레임 호출 ----------
  update() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this._schedule();

    // 지글지글 볼륨을 랜덤하게 흔들어 "살아있는" 소리로
    const target = this.sizzleLevel * 0.5 * (0.7 + Math.random() * 0.6);
    this.sizzleGain.gain.setTargetAtTime(target, t, 0.04);
    if (this.sizzleLevel > 0 && Math.random() < this.sizzleLevel * 0.3) {
      // 기름 튀는 '탁' 소리
      this._burst(t + Math.random() * 0.02, 0.006 + Math.random() * 0.012, {
        type: 'highpass', freq: 3500, vol: 0.05 + Math.random() * 0.12,
      });
    }
    // 반죽 부을 때 보글보글 거품
    if (this.pouring && Math.random() < 0.14) {
      const f = 220 + Math.random() * 300;
      this._tone(f, t, 0.06, { glideTo: f * 1.8, vol: 0.05, lowpass: 900 });
    }
    // 팥 짤 때 '쮸욱' 하는 끈적한 소리
    if (this.squeezing && Math.random() < 0.12) {
      const f = 120 + Math.random() * 90;
      this._tone(f, t, 0.09, { glideTo: f * 0.6, vol: 0.14, lowpass: 500 });
      this._burst(t, 0.05, { type: 'lowpass', freq: 380, vol: 0.08 });
    }
  },

  startSqueeze() {
    if (!this.ctx) return;
    this.squeezing = true;
    this.squeezeGain.gain.setTargetAtTime(0.7, this.now(), 0.04);
    this._tone(180, this.now(), 0.12, { glideTo: 90, vol: 0.18, lowpass: 600 });
  },

  stopSqueeze() {
    if (!this.ctx) return;
    this.squeezing = false;
    this.squeezeGain.gain.setTargetAtTime(0, this.now(), 0.05);
    this._tone(260, this.now(), 0.08, { glideTo: 420, vol: 0.08, lowpass: 900 }); // 끊기는 '뽁'
  },

  // ---------- 배경 음악 (로파이 재즈 느낌 4마디 루프) ----------
  _schedule() {
    const ctx = this.ctx;
    const six = 60 / this.bpm / 4; // 16분음표 길이(초)
    if (this.nextTime < ctx.currentTime - 0.5) this.nextTime = ctx.currentTime + 0.05; // 탭 전환 후 복구
    while (this.nextTime < ctx.currentTime + 0.15) {
      const st = this.step % 16;
      const bar = Math.floor(this.step / 16) % 4;
      const swing = st % 2 === 1 ? six * 0.2 : 0; // 살짝 스윙
      this._playStep(this.nextTime + swing, st, bar, six);
      this.nextTime += six;
      this.step++;
    }
  },

  CHORDS: [
    [53, 57, 60, 64], // Fmaj7
    [52, 55, 59, 62], // Em7
    [50, 53, 57, 60], // Dm7
    [55, 59, 62, 65], // G7
  ],
  BASS: [41, 40, 38, 43],
  MELODY: [
    [[2, 72], [6, 69], [9, 72], [12, 76]],
    [[2, 74], [5, 71], [8, 67], [13, 74]],
    [[2, 72], [6, 69], [10, 65], [12, 69]],
    [[1, 71], [4, 74], [8, 77], [14, 74]],
  ],

  _playStep(t, st, bar, six) {
    const B = this.bgmBus;
    const chord = this.CHORDS[bar];
    if (st === 0) chord.forEach((m, i) => this._ep(m, t + i * 0.018, six * 14, 0.07));
    if (st === 10) chord.slice(1).forEach((m, i) => this._ep(m + 12, t + i * 0.012, six * 5, 0.03));
    if (st === 0 || st === 7) this._bass(this.BASS[bar], t, six * 5);
    if (st === 10) this._bass(this.BASS[bar] + 7, t, six * 4);
    // 드럼
    if (st === 0 || st === 10) this._tone(110, t, 0.28, { glideTo: 42, vol: 0.45, dest: B });
    if (st === 4 || st === 12) {
      this._burst(t, 0.16, { freq: 1900, Q: 0.8, vol: 0.13, dest: B, wet: true });
      this._tone(190, t, 0.07, { vol: 0.06, dest: B });
    }
    if (st % 2 === 0) this._burst(t, 0.035, { type: 'highpass', freq: 7500, vol: st % 4 === 2 ? 0.05 : 0.025, dest: B });
    // 오르골 멜로디
    for (const [s, m] of this.MELODY[bar]) {
      if (s === st && Math.random() < 0.85) {
        this._tone(mtof(m), t, 1.1, { vol: 0.045, dest: B, wet: true });
        this._tone(mtof(m) * 3, t, 0.4, { vol: 0.008, dest: B, wet: true });
      }
    }
    // LP판 지직거림
    if (Math.random() < 0.3) this._burst(t, 0.008, { type: 'highpass', freq: 3000, vol: 0.015 + Math.random() * 0.03, dest: B });
  },

  _ep(m, t, dur, vol) {
    // 일렉트릭 피아노 느낌: 사인파 + 약한 배음
    this._tone(mtof(m), t, dur, { vol, attack: 0.012, lowpass: 2000, dest: this.bgmBus, wet: true });
    this._tone(mtof(m) * 2, t, dur * 0.3, { type: 'triangle', vol: vol * 0.18, dest: this.bgmBus });
  },

  _bass(m, t, dur) {
    this._tone(mtof(m), t, dur, { type: 'triangle', vol: 0.2, lowpass: 450, attack: 0.01, dest: this.bgmBus });
  },

  // ---------- 효과음 ----------
  now() { return this.ctx ? this.ctx.currentTime : 0; },

  setSizzle(level) { this.sizzleLevel = level; },

  startPour() {
    if (!this.ctx) return;
    this.pouring = true;
    this.pourGain.gain.setTargetAtTime(0.55, this.now(), 0.05);
    this._burst(this.now(), 0.25, { type: 'lowpass', freq: 900, vol: 0.15 }); // 첫 '촤' 소리
  },

  stopPour() {
    if (!this.ctx) return;
    this.pouring = false;
    this.pourGain.gain.setTargetAtTime(0, this.now(), 0.06);
  },

  coverPour() {
    // 팥 위에 반죽 한 번 더 — 짧게 붓기
    if (!this.ctx) return;
    const t = this.now();
    this.pouring = true;
    this.pourGain.gain.setTargetAtTime(0.4, t, 0.05);
    this.pourGain.gain.setTargetAtTime(0, t + 0.6, 0.08);
    setTimeout(() => (this.pouring = false), 650);
  },

  plop() {
    // 팥이 '퐁' 떨어지는 소리
    if (!this.ctx) return;
    const t = this.now();
    this._tone(420, t, 0.18, { glideTo: 95, vol: 0.35 });
    this._burst(t, 0.07, { type: 'lowpass', freq: 600, vol: 0.25 });
    this._burst(t + 0.02, 0.12, { freq: 900, Q: 2, vol: 0.1 });
  },

  clank(power = 1) {
    // 무쇠 틀이 '철컹' — 비정수배 배음(금속 특유의 소리)을 겹쳐요
    if (!this.ctx) return;
    const t = this.now();
    const base = 360 + Math.random() * 40;
    [1, 2.32, 4.25, 6.63, 9.38].forEach((r, i) => {
      this._tone(base * r, t, 0.9 - i * 0.12, { type: 'triangle', vol: (0.11 / (i + 1)) * power, wet: true });
    });
    this._burst(t, 0.03, { freq: 2600, Q: 1.2, vol: 0.45 * power });
    this._tone(95, t, 0.16, { glideTo: 48, vol: 0.35 * power });
    // 뒤집는 순간 지글 소리가 확 커짐
    this.sizzleGain.gain.setValueAtTime(0.7 * power, t + 0.02);
  },

  whoosh() {
    if (!this.ctx) return;
    this._burst(this.now(), 0.3, { freq: 500, freqTo: 2400, Q: 1.5, vol: 0.12, attack: 0.08 });
  },

  lift() {
    // 집게로 '쏙' 꺼내기
    if (!this.ctx) return;
    const t = this.now();
    this._tone(300, t, 0.12, { glideTo: 700, vol: 0.12 });
    this._burst(t, 0.2, { freq: 800, freqTo: 3000, vol: 0.1, attack: 0.04 });
    this._tone(2200, t + 0.06, 0.08, { type: 'triangle', vol: 0.05 }); // 집게 '딸깍'
  },

  crinkle() {
    // 종이봉투 바스락: 짧은 노이즈를 랜덤 타이밍으로 여러 번
    if (!this.ctx) return;
    const t = this.now();
    for (let i = 0; i < 12; i++) {
      this._burst(t + Math.random() * 0.45, 0.015 + Math.random() * 0.04, {
        type: 'highpass', freq: 1800 + Math.random() * 3500, vol: 0.12 + Math.random() * 0.2,
      });
    }
    this._burst(t, 0.12, { type: 'lowpass', freq: 500, vol: 0.2 }); // 툭 들어가는 소리
  },

  thud() {
    // 바닥에 떨어짐 + 실망 효과음
    if (!this.ctx) return;
    const t = this.now();
    this._tone(150, t, 0.22, { glideTo: 55, vol: 0.5 });
    this._burst(t, 0.1, { type: 'lowpass', freq: 380, vol: 0.4 });
    [392, 370, 349, 294].forEach((f, i) => this._tone(f, t + 0.25 + i * 0.16, i === 3 ? 0.55 : 0.16, { type: 'sawtooth', vol: 0.05, lowpass: 1100 }));
  },

  coin() {
    // 계산 '짤랑' + 금전등록기 벨
    if (!this.ctx) return;
    const t = this.now();
    this._tone(1975, t, 0.14, { type: 'square', vol: 0.05, lowpass: 5000 });
    this._tone(2637, t + 0.08, 0.6, { type: 'square', vol: 0.05, lowpass: 5000, wet: true });
    this._tone(2093, t + 0.08, 0.9, { vol: 0.08, wet: true });
    this._tone(3136, t + 0.08, 0.7, { vol: 0.04, wet: true });
  },

  grade(score) {
    if (!this.ctx) return;
    const t = this.now();
    let notes;
    if (score >= 90) notes = [72, 76, 79, 84];
    else if (score >= 70) notes = [72, 79];
    else if (score >= 45) notes = [72];
    else notes = null;
    if (notes) notes.forEach((m, i) => this._tone(mtof(m), t + i * 0.06, 0.35, { type: 'triangle', vol: 0.09, wet: true }));
    else this._tone(220, t, 0.3, { type: 'square', glideTo: 140, vol: 0.06, lowpass: 900 });
  },

  warn() {
    if (!this.ctx) return;
    this._tone(1040, this.now(), 0.07, { type: 'square', vol: 0.04, lowpass: 3000 });
  },

  tick() {
    if (!this.ctx) return;
    this._tone(1500, this.now(), 0.04, { vol: 0.08 });
  },

  start() {
    if (!this.ctx) return;
    const t = this.now();
    [67, 72, 76, 79].forEach((m, i) => this._tone(mtof(m), t + i * 0.08, 0.4, { type: 'triangle', vol: 0.08, wet: true }));
  },

  gameOver() {
    if (!this.ctx) return;
    const t = this.now();
    [79, 76, 72, 74, 77, 84].forEach((m, i) => this._tone(mtof(m), t + i * 0.13, i === 5 ? 1.4 : 0.4, { type: 'triangle', vol: 0.09, wet: true }));
    [53, 57, 60, 64].forEach((m) => this._tone(mtof(m), t + 0.65, 1.8, { vol: 0.05, wet: true }));
  },

  toggleMute() {
    if (!this.ctx) return;
    this.muted = !this.muted;
    this.master.gain.setTargetAtTime(this.muted ? 0 : 0.9, this.now(), 0.05);
  },
};
