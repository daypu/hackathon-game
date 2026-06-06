import { TITLES, FAIL_TITLE, STAT_MAX } from '../config.js';
import { clamp } from '../engine/utils.js';

// 综合结算：评分 + 取经称号 + 成就
export function evaluate(player, run, reached, distPct) {
  const s = player.stats;
  const statAvg = (s.mana + s.faith + s.scripture) / 3; // 0..100

  const pickupScore = Math.min(run.picks * 2, 30);
  const hitPenalty = run.hits * 2.5;
  let score = statAvg * 0.6 + pickupScore - hitPenalty + (reached ? 15 : 0);
  if (!reached) score = Math.min(score, 45); // 未抵达终点封顶
  score = Math.round(clamp(score, 0, 100));

  let title;
  if (!reached) {
    title = { ...FAIL_TITLE };
  } else {
    title = TITLES.find((tt) => score >= tt.min) || TITLES[TITLES.length - 1];
  }

  const achievements = computeAchievements(player, run, reached);

  return {
    score,
    title: title.name,
    stars: title.stars,
    desc: title.desc,
    achievements,
    reached,
    stats: { mana: s.mana, faith: s.faith, scripture: s.scripture },
    statAvg: Math.round(statAvg),
    distPct: Math.round(distPct * 100),
  };
}

function computeAchievements(player, run, reached) {
  const list = [];
  const s = player.stats;
  const add = (name, desc) => list.push({ name, desc });

  if (reached && run.hits === 0) add('金刚不坏', '全程未受任何妖障所伤');
  if (run.pickTypes.size >= 5) add('法宝齐备', '集齐全部五类正向法宝');
  if (run.cloudUsed > 0) add('腾云驾雾', '借筋斗云之力越过险境');
  if (run.shieldBlocked > 0) add('护身周全', '以护身符化解了致命一击');
  if (reached && s.scripture >= STAT_MAX) add('真经无损', '抵达灵山时经书完好如初');
  if ((run.picksByType.buddhalight || 0) >= 5) add('佛光普照', '沐浴佛光五次以上');
  if (reached && s.mana >= 80 && s.faith >= 80 && s.scripture >= 80)
    add('三宝圆满', '法力、信念、经书皆充盈');
  if (run.picks >= 30) add('广积福缘', '一路收集逾三十件法宝');
  if (reached && run.maxStreak >= 20)
    add('心无旁骛', '连续躲避二十次而不失手');

  if (list.length === 0)
    add('初入迷途', '万象迷途的第一段旅程已然开启');
  return list;
}
