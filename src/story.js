// 大地图剧情与 NPC 配置。
// chapter.targetLevel 对应 openWorld.js 中的关卡法阵 key。

export const STORY_CHAPTERS = [
  {
    key: 'intro',
    title: '观音点化',
    targetLevel: 'huaguoshan',
    objective: '前往西北的花果山法阵，寻回迷途中的第一缕佛光。',
    startMessage: '先与观音化身对话，听取万象迷途的第一道指引。',
  },
  {
    key: 'huaguoshan',
    title: '花果山旧誓',
    targetLevel: 'gaolaozhuang',
    objective: '前往东北的高老庄，探听村庄被妖气困住的缘由。',
    startMessage: '山神提醒你：下一站是东北方向的高老庄。',
  },
  {
    key: 'gaolaozhuang',
    title: '高庄夜灯',
    targetLevel: 'liushahe',
    objective: '沿路前往中部的流沙河，寻找渡河的线索。',
    startMessage: '高太公把残页托付给你：去流沙河问问船夫。',
  },
  {
    key: 'liushahe',
    title: '流沙渡口',
    targetLevel: 'huoyanshan',
    objective: '继续向东南抵达火焰山，借芭蕉扇破除烈焰。',
    startMessage: '船夫望向红云：火焰山的妖火挡住了正路。',
  },
  {
    key: 'huoyanshan',
    title: '一扇清风',
    targetLevel: 'leiyinsi',
    objective: '穿过最后一段山路，前往东北的灵山雷音寺。',
    startMessage: '铁扇侍女送来清风：雷音寺就在东北金光里。',
  },
  {
    key: 'leiyinsi',
    title: '雷音金光',
    targetLevel: null,
    objective: '走到雷音寺金光前，完成万象迷途的主线巡礼。',
    startMessage: '功德圆满：所有线索已经汇聚到雷音寺。',
  },
];

export const NPCS = [
  {
    key: 'guanyin',
    name: '观音化身',
    role: '引路人',
    x: 420,
    y: 1035,
    color: '#fff2b0',
    chapter: 'intro',
    activeLines: [
      '取经人，万象迷途并非一张普通地图。',
      '五处法阵被妖气缠住，若不逐一寻回因缘，灵山金光也会变得遥远。',
      '先去西北角的花果山。靠近绿色法阵后按空格，记住第一段旧誓。',
    ],
    doneLines: [
      '你已经听见花果山的回声。',
      '后面的路，要让每一处因缘自己开口。',
    ],
    lockedLines: [
      '莫急，先从花果山开始。',
      '路途会按你的脚步一段段亮起来。',
    ],
  },
  {
    key: 'mountain-god',
    name: '花果山山神',
    role: '花果山守望者',
    x: 380,
    y: 245,
    color: '#7fd06a',
    chapter: 'huaguoshan',
    activeLines: [
      '大圣当年出山，靠的不是神通，是一颗不肯回头的心。',
      '这里的妖雾最怕承诺。踏入花果山法阵，把第一缕佛光唤醒。',
      '之后去高老庄，那里有人守着一盏快熄的夜灯。',
    ],
    doneLines: ['花果山的风已经归位。去高老庄吧，别让村灯灭了。'],
    lockedLines: ['山雾未开。先听观音化身的指引，再来此处。'],
  },
  {
    key: 'gao-elder',
    name: '高太公',
    role: '村庄长者',
    x: 900,
    y: 345,
    color: '#e8b84a',
    chapter: 'gaolaozhuang',
    activeLines: [
      '客官，庄外夜夜有怪风，吹得人不敢点灯。',
      '若你愿入高老庄法阵，我便把这页残经交给你。',
      '残经上写着：水能载经，也能吞经。下一步该去流沙河。',
    ],
    doneLines: ['夜灯亮了，村民终于敢开门。去流沙河，别让经页沉下去。'],
    lockedLines: ['村门紧闭。等花果山的佛光亮起，我们才敢开门。'],
  },
  {
    key: 'river-boatman',
    name: '流沙河船夫',
    role: '渡口引路人',
    x: 1205,
    y: 625,
    color: '#6fb0c8',
    chapter: 'liushahe',
    activeLines: [
      '这河看着浅，底下全是忘念。',
      '踏入流沙河法阵时，不要急着追水面倒影，要找真正的渡口。',
      '过河之后向东南走。火焰山的红光，会把下一段路照出来。',
    ],
    doneLines: ['你已经过了流沙。火焰山热得很，记得找清风。'],
    lockedLines: ['船还未靠岸。先去高老庄取回那页残经。'],
  },
  {
    key: 'iron-fan-maid',
    name: '铁扇侍女',
    role: '清风使者',
    x: 1570,
    y: 650,
    color: '#e0533d',
    chapter: 'huoyanshan',
    activeLines: [
      '火焰山烧的不是山，是人心里的急躁。',
      '进入火焰山法阵，等三息再动，清风才会找到缝隙。',
      '若火势退去，东北金光便是雷音寺的门。',
    ],
    doneLines: ['清风已过山口。去雷音寺吧，金光正在等你。'],
    lockedLines: ['这里热浪太盛。没有流沙河的定心石，靠近只会迷路。'],
  },
  {
    key: 'lingshan-monk',
    name: '接引僧',
    role: '雷音寺守门人',
    x: 2150,
    y: 405,
    color: '#ffce54',
    chapter: 'leiyinsi',
    activeLines: [
      '五处因缘皆已照见，迷途也就不再是迷途。',
      '走入雷音寺法阵，让金光记下这一路的脚印。',
      '若还想回望，也可以先去和各处故人再说几句话。',
    ],
    doneLines: ['经路已成。愿你再入迷途时，也能认出自己的方向。'],
    lockedLines: ['金门未启。先去火焰山借一扇清风。'],
  },
];

export function createStoryState() {
  return {
    chapterIndex: 0,
    completedLevels: new Set(),
    talkedNpcs: new Set(),
  };
}

export function currentChapter(story) {
  return STORY_CHAPTERS[Math.min(story.chapterIndex, STORY_CHAPTERS.length - 1)];
}

export function chapterIndexByKey(key) {
  return STORY_CHAPTERS.findIndex((ch) => ch.key === key);
}

export function currentNpc(story) {
  const current = currentChapter(story);
  return NPCS.find((npc) => npc.chapter === current.key) || null;
}

export function hasTriggeredCurrentNpc(story) {
  const npc = currentNpc(story);
  return !npc || story.talkedNpcs.has(npc.key);
}

export function currentStoryInfo(story) {
  const chapter = currentChapter(story);
  const npc = currentNpc(story);
  const npcTriggered = hasTriggeredCurrentNpc(story);
  const lockedObjective =
    npc && chapter.targetLevel
      ? `先与「${npc.name}」对话，解锁当前关卡法阵。`
      : npc
        ? `先与「${npc.name}」对话，完成主线收束。`
        : chapter.objective;
  return {
    ...chapter,
    npcName: npc ? npc.name : '',
    npcTriggered,
    objective: npc && !npcTriggered ? lockedObjective : chapter.objective,
  };
}

export function npcStatus(story, npc) {
  const current = currentChapter(story);
  const npcChapterIndex = chapterIndexByKey(npc.chapter);
  if (npc.chapter === current.key) return 'active';
  if (npcChapterIndex >= 0 && npcChapterIndex < story.chapterIndex) return 'done';
  return 'locked';
}

export function npcLines(story, npc) {
  const status = npcStatus(story, npc);
  if (status === 'active') return npc.activeLines;
  if (status === 'done') return npc.doneLines || npc.activeLines.slice(-1);
  return npc.lockedLines || ['现在还不是时候。'];
}

export function triggerNpcStory(story, npcKey) {
  const npc = currentNpc(story);
  if (!npc || npc.key !== npcKey) return { triggered: false, chapter: currentChapter(story) };
  if (story.talkedNpcs.has(npcKey)) {
    return { triggered: false, alreadyTriggered: true, chapter: currentChapter(story) };
  }
  story.talkedNpcs.add(npcKey);
  return { triggered: true, chapter: currentChapter(story) };
}

export function levelProgressState(story, levelKey) {
  if (story.completedLevels.has(levelKey)) return 'completed';
  const chapter = currentChapter(story);
  if (chapter.targetLevel === levelKey && hasTriggeredCurrentNpc(story)) return 'unlocked';
  return 'locked';
}

export function isLevelUnlocked(story, levelKey) {
  return levelProgressState(story, levelKey) === 'unlocked';
}

export function completeStoryObjective(story, levelKey) {
  const chapter = currentChapter(story);
  if (story.completedLevels.has(levelKey)) {
    return { advanced: false, reason: 'completed', chapter };
  }
  if (!chapter.targetLevel || chapter.targetLevel !== levelKey) {
    return { advanced: false, reason: 'wrong-level', chapter };
  }
  if (!hasTriggeredCurrentNpc(story)) {
    return { advanced: false, reason: 'npc-required', chapter };
  }
  story.completedLevels.add(levelKey);
  if (story.chapterIndex < STORY_CHAPTERS.length - 1) story.chapterIndex++;
  return { advanced: true, reason: 'advanced', chapter: currentChapter(story) };
}
