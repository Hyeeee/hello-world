"""Build Atmos v2 from the deployed Atmos file.

1. Design system: snap every font size, corner radius and spacing value in the CSS
   to a small fixed scale, name the scales as tokens, and make look-alike parts
   (toggles, inputs, mood tags) share one style.
2. Check-in: show it one step at a time (mood -> a line -> nickname and post).

Usage: python3 make_v2.py <atmos index.html> <output index.html>
"""
import re, sys, json, collections

src, out = sys.argv[1], sys.argv[2]
h = open(src, encoding="utf-8").read()

# ---------------------------------------------------------------- CSS
m = re.search(r"(<style[^>]*>)(.*?)(</style>)", h, re.S)
css = m.group(2)

def stats(c):
    fs = collections.Counter(re.findall(r"font-size:\s*([0-9.]+px)", c))
    rad = collections.Counter(re.findall(r"border-radius:\s*([0-9.]+px)", c))
    sp = collections.Counter(re.findall(r"(?:padding|gap|margin)[a-z-]*:\s*([^;}]+)", c))
    return {"font sizes": len(fs), "radii": len(rad), "spacing combos": len(sp)}

before = stats(css)

# Type scale: 7 steps
TYPE = {10: "--text-xs", 12: "--text-sm", 14: "--text-md", 16: "--text-lg",
        18: "--text-xl", 22: "--text-2xl", 28: "--text-3xl"}
def snap_type(px):
    if px <= 10.5: return 10
    if px <= 12.5: return 12
    if px <= 14: return 14
    if px <= 16: return 16
    if px <= 19: return 18
    if px <= 24: return 22
    return 28
css = re.sub(r"font-size:\s*([0-9.]+)px",
             lambda mm: f"font-size:var({TYPE[snap_type(float(mm.group(1)))]})", css)

# Radius scale: tiny marks keep 2px, everything else snaps to 4 steps
RAD = {8: "--radius-sm", 12: "--radius-md", 16: "--radius-lg", 24: "--radius-xl"}
def snap_rad(px):
    if px <= 3: return None          # ticks and bars stay sharp
    if px <= 9: return 8
    if px <= 13: return 12
    if px <= 18: return 16
    return 24
def rad_sub(mm):
    v = float(mm.group(1))
    if v >= 99: return "border-radius:var(--radius-pill)"
    s = snap_rad(v)
    return f"border-radius:{'2px' if s is None else f'var({RAD[s]})'}"
css = re.sub(r"border-radius:\s*([0-9.]+)px(?![^;}]*\s[0-9])", rad_sub, css)

# Spacing scale (padding, gap, margin): only plain px lists, not calc()/env()
SPACE = [0, 1, 2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 32]
def snap_space(px):
    return min(SPACE, key=lambda s: (abs(s - px), s))
def space_sub(mm):
    prop, val = mm.group(1), mm.group(2)
    if re.search(r"calc|env|var|%|em|auto|vh|vw|clamp", val): return mm.group(0)
    nums = re.sub(r"(-?)([0-9.]+)px",
                  lambda n: f"{n.group(1)}{snap_space(float(n.group(2)))}px", val)
    return f"{prop}:{nums}"
css = re.sub(r"((?:padding|gap|margin)(?:-[a-z]+)?):\s*([^;}]+)", space_sub, css)

tokens = """
/* ---- Atmos design tokens (v2) ---- */
:root{
  --text-xs:10px;  /* mono meta: city, time, counters */
  --text-sm:12px;  /* captions, buttons in toggles, tags */
  --text-md:14px;  /* body and UI text */
  --text-lg:16px;  /* section titles */
  --text-xl:18px;  /* people's words (serif) */
  --text-2xl:22px; /* brand, Korean question */
  --text-3xl:28px; /* the question (serif) */
  --radius-sm:8px; --radius-md:12px; --radius-lg:16px; --radius-xl:24px; --radius-pill:999px;
}
"""

checkin_css = """
/* One toggle style everywhere: pressed = ink fill */
.vis{padding:4px;border-radius:var(--radius-md);background:var(--fill)}
.vis button{padding:6px 10px;border-radius:var(--radius-sm);font-size:var(--text-sm)}
.vis button[aria-pressed="true"]{background:var(--ink);color:var(--on-ink);box-shadow:none}
/* One input style: boxed */
#nick{border:1px solid var(--line-2);border-radius:var(--radius-md);background:var(--glass-2);padding:10px 14px}
#nick:focus{border:1px solid var(--ink)}
#nick.invalid{border-color:var(--err);border-style:solid}
.journal{border-radius:var(--radius-md)}
/* Mood names read the same in the picker and the feed */
/* keep Feels / High / Low on one line with the unit toggle */
.hl{gap:12px}
.pact .chip{font-family:var(--font);text-transform:none;letter-spacing:0;font-size:var(--text-sm)}

/* ---- Check-in, one step at a time (v2) ---- */
.steps{display:flex;gap:14px;margin:0 0 14px;padding:0;list-style:none;font-size:var(--text-sm);color:var(--ink-3)}
.steps li{display:flex;align-items:center;gap:6px;transition:color .3s}
.steps li i{display:grid;place-items:center;width:18px;height:18px;border-radius:50%;border:1px solid var(--line-2);
  font-style:normal;font-family:var(--mono);font-size:var(--text-xs);transition:background .3s,color .3s,border-color .3s}
.steps li.now{color:var(--ink)}
.steps li.now i{border-color:var(--ink)}
.steps li.done i{background:var(--ink);border-color:var(--ink);color:var(--on-ink)}
.steps .posted{color:var(--ink)}

.step:not(.on){display:none}
.step.on{animation:stepIn .45s cubic-bezier(.22,.9,.24,1) both}
@keyframes stepIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
.step-3{margin-top:12px}

/* step 1: the moods are the invitation, so they are bigger and gently alive */
.compose[data-step="1"] .mood .gl{width:46px;height:46px}
.compose[data-step="1"] .mood span{font-size:var(--text-sm);color:var(--ink)}
.compose[data-step="1"] .mood .gl{animation:breathe 3.6s ease-in-out infinite;animation-delay:calc(var(--i) * .35s)}
@keyframes breathe{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
.compose[data-step="1"] .mood:hover .gl{animation-play-state:paused;transform:scale(1.08)}
.compose:not([data-step="1"]) .mood:not([aria-checked="true"]) .gl{opacity:.55}
.compose .mood .gl{transition:width .35s,height .35s,opacity .3s,transform .25s cubic-bezier(.3,1.6,.5,1),background .2s,color .2s}
@media (max-width:699px){ .compose[data-step="1"] .mood .gl{width:42px;height:42px} }
@media (prefers-reduced-motion:reduce){ .compose .mood .gl{animation:none!important} .step.on{animation:none} }
"""

css = tokens + css + checkin_css
after = stats(css)
h = h[:m.start(2)] + css + h[m.end(2):]

# ---------------------------------------------------------------- markup
old_block = re.search(
    r'(<p class="compose-q" data-ih="composeQ"></p>\s*<div class="moods" id="moods"[^>]*></div>)\s*'
    r'(<div class="nick-row">.*?</div>)\s*'
    r'(<textarea class="journal".*?</textarea>)\s*'
    r'(<div class="where".*?</div>)\s*'
    r'(<div class="compose-foot">.*?id="postBtn".*?</button>\s*</div>)', h, re.S)
assert old_block, "check-in markup not found"
q_moods, nick, journal, where, foot = old_block.groups()
q_moods = q_moods.replace('</p>', '</p>\n      <ol class="steps" id="steps" aria-live="polite"></ol>', 1)
new_block = (f'{q_moods}\n'
             f'      <div class="step step-2" id="step2"><div>\n        {journal}\n      </div></div>\n'
             f'      <div class="step step-3" id="step3"><div>\n        {nick}\n        {where}\n        {foot}\n      </div></div>')
h = h[:old_block.start()] + new_block + h[old_block.end():]
# the section that holds the check-in becomes the "compose" root
h = h.replace('<div class="sec">\n      <p class="compose-q"', '<div class="sec compose" id="compose" data-step="1">\n      <p class="compose-q"', 1)
assert 'id="compose"' in h

# ---------------------------------------------------------------- app script
# after a post, start again from step 1
h = h.replace("jr.value=''; growJr();",
              "jr.value=''; growJr(); S.mood=null; moodsEl.querySelectorAll('.mood').forEach(x=>x.setAttribute('aria-checked','false')); window.dispatchEvent(new Event('atmos:posted'));", 1)
assert "atmos:posted" in h

step_js = r"""
<script>
/* Atmos v2 · check-in one step at a time */
(() => {
  const T = {
    en: { steps: ['Mood', 'A line', 'Post'], posted: 'Posted. You can find it in the feed below.',
          ph: { radiant: 'What made today bright?', calm: 'What’s keeping things calm?', cozy: 'What feels warm today?',
                foggy: 'What feels a little blurry right now?', blue: 'What’s weighing on you today?', stormy: 'What’s stirring things up?' } },
    ko: { steps: ['기분', '한 줄', '기록'], posted: '기록했어요. 아래 피드에서 볼 수 있어요.',
          ph: { radiant: '오늘을 밝게 만든 건 뭐였어요?', calm: '무엇 덕분에 차분한가요?', cozy: '오늘 따뜻하게 느껴지는 건요?',
                foggy: '지금 흐릿하게 느껴지는 건 뭐예요?', blue: '오늘 마음에 걸리는 게 있나요?', stormy: '무엇이 마음을 흔들고 있나요?' } }
  };
  const lang = () => (document.documentElement.lang || 'en').slice(0, 2) === 'ko' ? 'ko' : (document.documentElement.lang || 'en').startsWith('zh') ? null : 'en';
  const compose = document.getElementById('compose');
  const moods = document.getElementById('moods');
  const jr = document.getElementById('journal');
  const s2 = document.getElementById('step2'), s3 = document.getElementById('step3');
  const stepsEl = document.getElementById('steps');
  let basePh = null, postedUntil = 0, last = '';

  moods.querySelectorAll('.mood').forEach((b, i) => b.style.setProperty('--i', i));

  function current() {
    const mood = moods.querySelector('.mood[aria-checked="true"]');
    if (!mood) return { step: 1, mood: null };
    if (!jr.value.trim()) return { step: 2, mood: mood.dataset.id };
    return { step: 3, mood: mood.dataset.id };
  }

  function render() {
    const { step, mood } = current();
    const L = T[lang()] || T.en;
    const key = step + '|' + mood + '|' + lang() + '|' + (Date.now() < postedUntil);
    if (key === last) return; last = key;

    compose.dataset.step = step;
    s2.classList.toggle('on', step >= 2);
    s3.classList.toggle('on', step >= 3);
    s2.inert = step < 2; s3.inert = step < 3;

    if (Date.now() < postedUntil && step === 1) {
      stepsEl.innerHTML = `<li class="posted">${L.posted}</li>`;
    } else {
      stepsEl.innerHTML = L.steps.map((t, i) =>
        `<li class="${i + 1 < step ? 'done' : i + 1 === step ? 'now' : ''}"><i>${i + 1 < step ? '✓' : i + 1}</i>${t}</li>`).join('');
    }

    // the placeholder asks about the mood you picked (zh keeps the original)
    if (basePh === null) basePh = jr.placeholder;
    jr.placeholder = (lang() && mood && T[lang()].ph[mood]) || basePh;
  }

  moods.addEventListener('click', e => {
    const b = e.target.closest('.mood'); if (!b) return;
    const wasStep1 = compose.dataset.step === '1';
    setTimeout(() => { render(); if (wasStep1 && !jr.value.trim()) jr.focus({ preventScroll: true }); }, 0);
  });
  jr.addEventListener('input', render);
  window.addEventListener('atmos:posted', () => { postedUntil = Date.now() + 5000; last = ''; render(); setTimeout(() => { last = ''; render(); }, 5100); });
  // language switches and restored drafts change things without events, so check gently
  new MutationObserver(() => { last = ''; render(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang', 'class'] });
  render();
})();
</script>
"""
h = h.replace("</body>", step_js + "</body>", 1)

open(out, "w", encoding="utf-8").write(h)
print(json.dumps({"before": before, "after": after}))
