import phase1 from './wuzi_boss_phase1.png';
import phase2 from './wuzi_boss_phase2.png';
import phase3 from './wuzi_boss_phase3.png';
import phase1Sheet from './wuzi_boss_phase1_sheet.png';
import phase2Sheet from './wuzi_boss_phase2_sheet.png';
import phase3Sheet from './wuzi_boss_phase3_sheet.png';

export const WUZI_BOSS_FRAME = {
  w: 360,
  h: 360,
  count: 4,
};

export const WUZI_BOSS_PHASES = [
  { key: 'phase1', label: '封卷形态', image: phase1, sheet: phase1Sheet },
  { key: 'phase2', label: '开眼形态', image: phase2, sheet: phase2Sheet },
  { key: 'phase3', label: '残卷暴走', image: phase3, sheet: phase3Sheet },
];
