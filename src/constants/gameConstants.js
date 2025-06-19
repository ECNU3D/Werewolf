// Role keys for translation
export const ROLES = {
  WEREWOLF: 'WEREWOLF',
  SEER: 'SEER',
  WITCH: 'WITCH',
  HUNTER: 'HUNTER',
  GUARD: 'GUARD',
  VILLAGER: 'VILLAGER',
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

// Game phase keys for translation
export const GAME_PHASES = {
  SETUP: 'SETUP',
  SHOW_ROLE_MODAL: 'SHOW_ROLE_MODAL',
  NIGHT_START: 'NIGHT_START',
  WEREWOLVES_ACT: 'WEREWOLVES_ACT',
  GUARD_ACTS: 'GUARD_ACTS',
  SEER_ACTS: 'SEER_ACTS',
  WITCH_ACTS_SAVE: 'WITCH_ACTS_SAVE',
  WITCH_ACTS_POISON: 'WITCH_ACTS_POISON',
  NIGHT_RESOLUTION: 'NIGHT_RESOLUTION',
  DAY_START: 'DAY_START',
  HUNTER_MAY_ACT: 'HUNTER_MAY_ACT',
  DISCUSSION: 'DISCUSSION',
  VOTING: 'VOTING',
  VOTE_RESULTS: 'VOTE_RESULTS',
  GAME_OVER: 'GAME_OVER',
}; 