import { ROLES, ROLE_DISTRIBUTION, INITIAL_PLAYER_STATE, PLAYER_COUNT } from '../constants/gameConstants';
import { LANGUAGES, translations } from '../constants/languages';

export const createAISystemPrompt = (role, playerId, language = LANGUAGES.CHINESE) => {
  const t = translations[language];
  
  let aiSystemPrompt = '';
  
  if (language === LANGUAGES.CHINESE) {
    aiSystemPrompt = `你正在一个在线文字狼人杀游戏中扮演一名AI玩家。你的玩家ID是 ${playerId}。\n`;
    aiSystemPrompt += `你的身份是 ${t.roles[role]}。\n`;
    
    if (role === ROLES.WEREWOLF) aiSystemPrompt += `你的目标是消灭所有神民阵营的玩家（预言家, 女巫, 猎人, 守卫, 平民）。夜晚与狼同伴一起选择一名玩家进行攻击。白天隐藏身份，误导好人，避免被投票出局。\n`;
    if (role === ROLES.SEER) aiSystemPrompt += `你的目标是找出所有狼人。每晚可以查验一名玩家的身份（狼人或好人）。白天你需要用你的信息引导好人投票，但要小心不要过早暴露自己而被狼人杀死。\n`;
    if (role === ROLES.WITCH) aiSystemPrompt += `你有一瓶解药和一瓶毒药，每种药剂整局游戏只能使用一次。解药可以在夜晚救一名被狼人攻击的玩家。毒药可以在夜晚毒杀一名玩家。你需要谨慎使用你的药剂。\n`;
    if (role === ROLES.GUARD) aiSystemPrompt += `你的目标是保护好人阵营。每晚可以守护一名玩家免受狼人攻击，但不能连续两晚守护同一个人。你需要判断谁最可能成为狼人的目标，或者谁对好人阵营最重要。\n`;
    if (role === ROLES.HUNTER) aiSystemPrompt += `当你死亡时（无论是被狼人杀害还是被投票出局），你可以选择开枪带走场上任何一名存活的玩家。你需要判断谁是狼人，或者谁对狼人阵营最重要。\n`;
    if (role === ROLES.VILLAGER) aiSystemPrompt += `你的目标是帮助找出并投票淘汰所有狼人。你没有特殊能力，需要通过分析其他玩家的发言和行为来判断他们的身份。\n`;
    
    aiSystemPrompt += `在适当的时候，你需要根据你的角色和获取到的信息（如查验结果、场上发言、投票情况）做出决策，例如选择攻击/守护/查验/用药的目标，或者在白天发言和投票。\n`;
    aiSystemPrompt += `你的回复应该简洁，符合角色。如果被要求提供ID，请只回复数字ID。如果被要求发言，请直接陈述。不要暴露你是AI。`;
  } else {
    // English prompts
    aiSystemPrompt = `You are an AI player in an online text-based Werewolf game. Your player ID is ${playerId}.\n`;
    aiSystemPrompt += `Your role is ${t.roles[role]}.\n`;
    
    if (role === ROLES.WEREWOLF) aiSystemPrompt += `Your goal is to eliminate all villager faction players (Seer, Witch, Hunter, Guard, Villager). At night, work with your werewolf teammates to choose a player to attack. During the day, hide your identity, mislead villagers, and avoid being voted out.\n`;
    if (role === ROLES.SEER) aiSystemPrompt += `Your goal is to find all werewolves. Each night you can check one player's identity (werewolf or villager). During the day, use your information to guide villagers' votes, but be careful not to expose yourself too early and get killed by werewolves.\n`;
    if (role === ROLES.WITCH) aiSystemPrompt += `You have one antidote and one poison potion, each can only be used once per game. The antidote can save a player attacked by werewolves at night. The poison can kill a player at night. Use your potions wisely.\n`;
    if (role === ROLES.GUARD) aiSystemPrompt += `Your goal is to protect the villager faction. Each night you can protect one player from werewolf attacks, but you cannot protect the same person for two consecutive nights. Judge who is most likely to be targeted by werewolves or who is most important to the villager faction.\n`;
    if (role === ROLES.HUNTER) aiSystemPrompt += `When you die (whether killed by werewolves or voted out), you can choose to shoot and take down any living player. You need to judge who is a werewolf or who is most important to the werewolf faction.\n`;
    if (role === ROLES.VILLAGER) aiSystemPrompt += `Your goal is to help find and vote out all werewolves. You have no special abilities and need to analyze other players' speeches and behaviors to determine their identities.\n`;
    
    aiSystemPrompt += `When appropriate, make decisions based on your role and the information you have (such as check results, speeches, voting patterns), like choosing targets to attack/protect/check/poison, or speaking and voting during the day.\n`;
    aiSystemPrompt += `Your responses should be concise and in character. If asked to provide an ID, only reply with the numeric ID. If asked to speak, make direct statements. Don't reveal that you are an AI.`;
  }
  
  return aiSystemPrompt;
};

export const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const initializePlayers = (gameConfig = { isRandomRole: true, selectedRole: null, language: LANGUAGES.CHINESE }) => {
  let rolesToAssign = [...ROLE_DISTRIBUTION];
  let humanId = Math.floor(Math.random() * PLAYER_COUNT);
  const language = gameConfig.language || LANGUAGES.CHINESE;
  const t = translations[language];
  
  // If player selected a specific role, ensure they get it
  if (!gameConfig.isRandomRole && gameConfig.selectedRole) {
    const selectedRoleIndex = rolesToAssign.indexOf(gameConfig.selectedRole);
    if (selectedRoleIndex !== -1) {
      // Remove the selected role from the pool
      rolesToAssign.splice(selectedRoleIndex, 1);
      
      // Shuffle the remaining roles for AI players
      rolesToAssign = shuffleArray(rolesToAssign);
    } else {
      // Fallback: if selected role is not in the pool (shouldn't happen), use random
      rolesToAssign = shuffleArray(ROLE_DISTRIBUTION);
    }
  } else {
    // Random assignment
    rolesToAssign = shuffleArray(ROLE_DISTRIBUTION);
  }
  
  const newPlayers = Array(PLAYER_COUNT).fill(null).map((_, index) => {
    let role;
    const isHuman = index === humanId;
    
    if (isHuman) {
      // Assign role to human player
      if (!gameConfig.isRandomRole && gameConfig.selectedRole) {
        role = gameConfig.selectedRole;
      } else {
        role = rolesToAssign[0];
        rolesToAssign.shift(); // Remove the assigned role
      }
    } else {
      // Assign role to AI player from remaining roles
      const availableRoles = rolesToAssign.length > 0 ? rolesToAssign : ROLE_DISTRIBUTION;
      const aiIndex = rolesToAssign.length > 0 ? 0 : (index > humanId ? index - 1 : index);
      role = availableRoles[aiIndex % availableRoles.length];
      
      // Remove the assigned role from the pool if we're using the managed pool
      if (rolesToAssign.length > 0) {
        rolesToAssign.shift();
      }
    }
    
    return {
      ...INITIAL_PLAYER_STATE,
      id: index,
      name: isHuman 
        ? `${t.common.player} ${index} (${t.common.you})` 
        : `${t.common.player} ${index}`,
      role: role,
      isHuman: isHuman,
      aiSystemPrompt: createAISystemPrompt(role, index, language),
    };
  });

  return { newPlayers, humanId };
};

export const checkWinCondition = (players) => {
  const alivePlayers = players.filter(p => p.isAlive);
  
  if (alivePlayers.length === 0) {
    return { gameOver: true, winner: 'DRAW' };
  }
  
  const aliveWerewolves = alivePlayers.filter(p => p.role === ROLES.WEREWOLF);
  const aliveGodsAndVillagers = alivePlayers.filter(p => p.role !== ROLES.WEREWOLF);
  
  if (aliveWerewolves.length === 0) {
    return { gameOver: true, winner: 'VILLAGERS' };
  }
  
  if (aliveWerewolves.length >= aliveGodsAndVillagers.length) {
    return { gameOver: true, winner: 'WEREWOLVES' };
  }
  
  return { gameOver: false, winner: null };
}; 