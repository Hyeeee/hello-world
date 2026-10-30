// =============================================================
//  i18n.js — 한국어 / English 텍스트
//  화면에 나오는 글자는 전부 여기 있어요. T('키') 로 현재 언어 글자를 가져옵니다.
//  언어 바꾸기: 시작 화면의 "한국어 | EN" 버튼, L 키, 또는 주소 뒤에 ?lang=en
// =============================================================

let LANG = 'ko';

const TEXT = {
  ko: {
    title: '붕어빵 장인',
    subtitle: '원버튼 붕어빵 포장마차 · 100초 동안 최대한 많이, 예쁘게!',
    howto: [
      '1  꾹 눌러 반죽 붓기',
      '2  꾹 눌러 팥 쭉 짜기',
      '3  노릇할 때 뒤집기',
      '4  노릇할 때 꺼내기',
      '5  봉투에 담아 전달 (자동)',
    ],
    start: 'SPACE · 클릭 · 터치로 시작',
    footer: (best) => `최고 점수 ${best}   ·   M = 소리   ·   L = 언어`,
    steps: ['반죽 붓기', '팥 짜기', '뒤집기', '꺼내기', '포장·전달'],
    hints: {
      pour: '꾹 누르고 있으면 반죽이 나와요 → 초록 구간에서 떼기!',
      bean: '꾹 누르면 머리부터 팥이 쭉~ 깃발에서 떼기!',
      cover: '팥 위에 반죽을 덮는 중…',
      cookA: '노릇노릇해지면 눌러서 뒤집기 (타기 전에!)',
      flip: '철컹!',
      cookB: '이쪽도 노릇해지면 눌러서 꺼내기',
      lift: '봉투에 담는 중…',
      bagging: '봉투에 담는 중…',
      handover: '손님께 전달!',
    },
    score: '점수',
    sold: (n) => `${n}마리`,
    customer: (n) => `손님 ${n}`,
    orders: [
      '붕어빵 하나 주세요!',
      '팥 꽉 차게요~',
      '바삭하게 부탁해요!',
      '노릇노릇한 걸로요 :)',
      '안 탄 걸로 주세요…',
      '하나만 포장해 주세요!',
      '제일 예쁜 걸로요!',
    ],
    comments: ['인생 붕어빵이에요!!', '와 맛있어요~', '음… 먹을 만하네요', '다음엔 잘 부탁해요…'],
    ranks: ['수습생', '동네 붕어빵집', '골목 맛집 사장님', '붕어빵 장인'],
    over: '영업 종료!',
    soldLine: (n, avg) => `판매 ${n}마리   ·   한 마리 평균 ${avg}점`,
    total: '총점',
    newBest: '★ 최고 기록!',
    bestLine: (n) => `최고 기록 ${n}`,
    again: '누르면 다시 시작',
    points: (n) => `+${n}점`,
    overflow: '넘쳤어요!',
    spilled: '꼬리 밖으로 넘쳤어요',
    tooShort: '팥이 너무 짧아요',
    burnt: '탔어요…',
    flag: '여기까지!',
    gaugePour: '반죽 양',
    gaugeCook: '익힘',
    golden: '노릇',
    burntLbl: '탐',
    sign1: '붕어빵',
    sign2: '3개 2,000원',
    signSize: [42, 30],
  },

  en: {
    title: 'Bungeoppang Master',
    subtitle: 'One-button Korean fish bread stall · make as many as you can in 100s!',
    howto: [
      '1  Hold to pour batter',
      '2  Hold to squeeze red bean',
      '3  Flip when golden',
      '4  Take out when golden',
      '5  Bag & serve (auto)',
    ],
    start: 'Press SPACE · click · tap to start',
    footer: (best) => `Best ${best}   ·   M = sound   ·   L = language`,
    steps: ['Pour', 'Red Bean', 'Flip', 'Take Out', 'Bag & Serve'],
    hints: {
      pour: 'Hold to pour the batter → let go in the green zone!',
      bean: 'Hold to squeeze red bean from head to tail — let go at the flag!',
      cover: 'Covering the red bean with batter…',
      cookA: 'Flip it when it turns golden brown (before it burns!)',
      flip: 'Clank!',
      cookB: 'Take it out when this side is golden too',
      lift: 'Bagging it up…',
      bagging: 'Bagging it up…',
      handover: 'Here you go!',
    },
    score: 'SCORE',
    sold: (n) => `${n} sold`,
    customer: (n) => `Customer ${n}`,
    orders: [
      'One fish bread, please!',
      'Lots of red bean, please~',
      'Make it crispy!',
      'Golden brown, please :)',
      'Not a burnt one, please…',
      'Just one to go!',
      'The prettiest one!',
    ],
    comments: ['Best one of my life!!', 'Mmm, so good~', 'Hmm… it\'s okay', 'Do better next time…'],
    ranks: ['Apprentice', 'Neighborhood Stall', 'Famous Alley Shop', 'Bungeoppang Master'],
    over: 'Closing time!',
    soldLine: (n, avg) => `${n} sold   ·   avg ${avg} pts each`,
    total: 'TOTAL',
    newBest: '★ New best!',
    bestLine: (n) => `Best ${n}`,
    again: 'Press to play again',
    points: (n) => `+${n} pts`,
    overflow: 'Overflow!',
    spilled: 'Spilled into the tail!',
    tooShort: 'Not enough red bean',
    burnt: 'Burnt…',
    flag: 'Stop here!',
    gaugePour: 'Batter',
    gaugeCook: 'Doneness',
    golden: 'Golden',
    burntLbl: 'Burnt',
    sign1: 'Fish Bread',
    sign2: '3 for ₩2,000',
    signSize: [32, 26],
  },
};

const T = (key) => TEXT[LANG][key];

function initLang() {
  let l = null;
  try { l = new URLSearchParams(location.search).get('lang'); } catch (e) {}
  if (!l) { try { l = localStorage.getItem('bungeoppang-lang'); } catch (e) {} }
  LANG = l === 'en' ? 'en' : 'ko';
  document.documentElement.lang = LANG;
}

function setLang(l) {
  LANG = l;
  document.documentElement.lang = l;
  try { localStorage.setItem('bungeoppang-lang', l); } catch (e) {}
  buildBackground(); // 가격표 글씨 다시 그리기
}
