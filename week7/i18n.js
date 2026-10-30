// =============================================================
//  i18n.js — 한국어 / English 텍스트
//  화면에 나오는 글자는 전부 여기 있어요. T('키') 로 현재 언어 글자를 가져옵니다.
//  언어 바꾸기: 시작 화면의 "한국어 | EN" 버튼, L 키, 또는 주소 뒤에 ?lang=en
// =============================================================

let LANG = 'ko';

const TEXT = {
  ko: {
    title: '붕어빵 장인',
    subtitle: '원판 붕어빵 기계로 줄 선 손님들 주문을 받아요 · 120초',
    howto: [
      '1  앞에 온 빈 틀: 꾹 눌러 반죽 붓기',
      '2  꾹 눌러 팥 쭉 짜기 → 틀이 닫히고 원판이 돌아요',
      '3  굽던 틀이 돌아오면 노릇할 때 눌러서 꺼내기',
      '4  주문 개수만큼 모이면 자동으로 포장·전달',
      '5  손님이 너무 오래 기다리면 가버려요!',
    ],
    start: 'SPACE · 클릭 · 터치로 시작',
    footer: (best) => `최고 점수 ${best}   ·   M = 소리   ·   L = 언어`,
    steps: ['반죽 붓기', '팥 짜기', '뒤집기', '꺼내기', '포장·전달'],
    hints: {
      opening: '틀 여는 중…',
      pour: '꾹 누르고 있으면 반죽이 나와요 → 초록 구간에서 떼기!',
      bean: '꾹 누르면 머리부터 팥이 쭉~ 깃발에서 떼기!',
      cover: '반죽 덮고 틀 닫는 중…',
      closing: '철컥!',
      rotating: '원판 돌리는 중…',
      take: '노릇노릇하면 눌러서 꺼내기! (기다리면 타요)',
      taking: '식힘망으로 쏙!',
    },
    orderN: (n, i) => [`붕어빵 ${n}개 주세요!`, `${n}개 포장해 주세요~`, `노릇한 걸로 ${n}개요!`, `${n}개요, 바삭하게!`][i % 4],
    left: '손님이 기다리다 가버렸어요…',
    rack: (n) => `식힘망 ${n}개`,
    score: '점수',
    sold: (n) => `손님 ${n}명`,
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
    soldLine: (served, fish, lost) => `손님 ${served}명 · 붕어빵 ${fish}개 판매 · 놓친 손님 ${lost}명`,
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
    subtitle: 'Run the rotating fish-bread machine and serve the line · 120s',
    howto: [
      '1  Empty mold in front: hold to pour batter',
      '2  Hold to squeeze red bean → lid closes, wheel turns',
      '3  When a cooking mold comes back, press when golden',
      '4  Orders are bagged & served automatically',
      '5  Customers leave if they wait too long!',
    ],
    start: 'Press SPACE · click · tap to start',
    footer: (best) => `Best ${best}   ·   M = sound   ·   L = language`,
    steps: ['Pour', 'Red Bean', 'Flip', 'Take Out', 'Bag & Serve'],
    hints: {
      opening: 'Opening the mold…',
      pour: 'Hold to pour the batter → let go in the green zone!',
      bean: 'Hold to squeeze red bean head → tail, let go at the flag!',
      cover: 'Covering with batter, closing the lid…',
      closing: 'Clank!',
      rotating: 'Turning the wheel…',
      take: 'Press when it\'s golden to take it out! (wait too long = burnt)',
      taking: 'Onto the cooling rack!',
    },
    orderN: (n, i) => [`${n} fish bread, please!`, `${n} to go, please~`, `${n} golden ones!`, `${n}, extra crispy!`][i % 4],
    left: 'A customer gave up and left…',
    rack: (n) => `On rack: ${n}`,
    score: 'SCORE',
    sold: (n) => `${n} served`,
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
    soldLine: (served, fish, lost) => `${served} customers · ${fish} fish sold · ${lost} lost`,
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
  if (typeof window.onLangChanged === 'function') window.onLangChanged(); // 화면 글자 다시 쓰기
}
