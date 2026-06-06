export const GAME = {
  width: 960,
  height: 540,
};

export const PAL = {
  white: '#f5efe0',
  ink: '#1a1526',
  gold: '#ffce54',
  red: '#e0533d',
  blue: '#4aa3ff',
  green: '#7ed957',
  sand0: '#0c223a',
  sand1: '#133955',
  foam: '#bdefff',
  wood0: '#8b5a2b',
  wood1: '#b98145',
  wood2: '#6b3f1f',
  robeRed: '#d94b3d',
  robeGold: '#ffce54',
  teal0: '#2e7a72',
  teal1: '#3aa39a',
  skin: '#f1c7a2',
  outline: '#2c1b0c',
  water0: '#1e6b9c',
  water1: '#4a9fc8',
  warn: '#ff7a6a',
};

export const TUNING = {
  roundSeconds: 30,
  introSeconds: 3,

  action: {
    rowingSeconds: 0.15,
    bailingSeconds: 0.22,
    attackingSeconds: 0.3,
    feedbackSeconds: 0.35,
  },

  monster: {
    startDistance: 70,
    chaseBase: 5.8,
    chaseRamp: 3.8,
    fearNearStart: 26,
    fearNearPerSec: 3.2,
  },

  boat: {
    speedMax: 24,
    speedDecayPerSec: 9,
  },

  rowing: {
    basePush: 12.5,
    sameKeyFactor: 0.35,
    comboMax: 8,
    comboBonus: 0.08,
  },

  water: {
    max: 100,
    bailAmount: 8.6,
    waveAdd: 18,
  },

  wave: {
    warningSeconds: 1,
    spawnMin: 6,
    spawnMax: 9,
  },

  fear: {
    start: 20,
    max: 100,
    basePerSec: 0.7,
    comfortSuccessReduce: 20,
    comfortFailAdd: 12,
    hitByWaveAdd: 7,
    hitByDemonAdd: 14,
  },

  dialogue: {
    cooldownSeconds: 7,
    maxSeconds: 3,
    seqMin: 2,
    seqMax: 3,
  },

  demon: {
    cooldownSeconds: 6,
    activeSeconds: 1.4,
  },

  score: {
    base: 800,
    dist: 700,
    water: 700,
    calm: 600,
    combo: 40,
    bail: 10,
    dialogueSuccess: 120,
    dialogueFail: 80,
    demonHit: 120,
    demonFail: 90,
    demonMiss: 40,
    sameKeyPenalty: 8,
    max: 5000,
    ranks: [
      { min: 2600, grade: 'S', title: '护法金身' },
      { min: 2200, grade: 'A', title: '稳渡流沙' },
      { min: 1800, grade: 'B', title: '有惊无险' },
      { min: 1400, grade: 'C', title: '勉强过河' },
      { min: 0, grade: 'D', title: '险象环生' },
    ],
  },
};
