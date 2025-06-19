export const ROLES = {
  WEREWOLF: '狼人',
  SEER: '预言家',
  WITCH: '女巫',
  HUNTER: '猎人',
  GUARD: '守卫',
  VILLAGER: '平民',
};

export const PLAYER_COUNT = 8;
export const ROLE_DISTRIBUTION = [
  ROLES.WEREWOLF, ROLES.WEREWOLF,
  ROLES.SEER, ROLES.WITCH, ROLES.HUNTER, ROLES.GUARD,
  ROLES.VILLAGER, ROLES.VILLAGER,
];

export const INITIAL_PLAYER_STATE = {
  id: 0,
  name: '',
  role: '',
  isHuman: false,
  isAlive: true,
  isProtected: false, 
  isTargetedByWolf: false, 
  isHealedByWitch: false, 
  votes: 0, 
  revealedRole: null, 
  aiSystemPrompt: '', 
};

export const GAME_PHASES = {
  SETUP: '游戏设置',
  SHOW_ROLE_MODAL: '显示角色卡',
  NIGHT_START: '夜晚开始',
  WEREWOLVES_ACT: '狼人行动',
  GUARD_ACTS: '守卫行动',
  SEER_ACTS: '预言家行动',
  WITCH_ACTS_SAVE: '女巫行动 - 救人',
  WITCH_ACTS_POISON: '女巫行动 - 毒人',
  NIGHT_RESOLUTION: '夜晚结算',
  DAY_START: '白天开始 - 公布死讯',
  HUNTER_MAY_ACT: '猎人行动（如果死亡）',
  DISCUSSION: '讨论阶段',
  VOTING: '投票阶段',
  VOTE_RESULTS: '投票结果',
  GAME_OVER: '游戏结束',
}; 