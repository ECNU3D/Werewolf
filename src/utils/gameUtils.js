import { ROLES, ROLE_DISTRIBUTION, INITIAL_PLAYER_STATE, PLAYER_COUNT } from '../constants/gameConstants';

export const createAISystemPrompt = (role, playerId) => {
  let aiSystemPrompt = `你正在一个在线文字狼人杀游戏中扮演一名AI玩家。你的玩家ID是 ${playerId}。\n`;
  aiSystemPrompt += `你的身份是 ${role}。\n`;
  if (role === ROLES.WEREWOLF) aiSystemPrompt += `你的目标是消灭所有神民阵营的玩家（预言家, 女巫, 猎人, 守卫, 平民）。夜晚与狼同伴一起选择一名玩家进行攻击。白天隐藏身份，误导好人，避免被投票出局。\n`;
  if (role === ROLES.SEER) aiSystemPrompt += `你的目标是找出所有狼人。每晚可以查验一名玩家的身份（狼人或好人）。白天你需要用你的信息引导好人投票，但要小心不要过早暴露自己而被狼人杀死。\n`;
  if (role === ROLES.WITCH) aiSystemPrompt += `你有一瓶解药和一瓶毒药，每种药剂整局游戏只能使用一次。解药可以在夜晚救一名被狼人攻击的玩家。毒药可以在夜晚毒杀一名玩家。你需要谨慎使用你的药剂。\n`;
  if (role === ROLES.GUARD) aiSystemPrompt += `你的目标是保护好人阵营。每晚可以守护一名玩家免受狼人攻击，但不能连续两晚守护同一个人。你需要判断谁最可能成为狼人的目标，或者谁对好人阵营最重要。\n`;
  if (role === ROLES.HUNTER) aiSystemPrompt += `当你死亡时（无论是被狼人杀害还是被投票出局），你可以选择开枪带走场上任何一名存活的玩家。你需要判断谁是狼人，或者谁对狼人阵营最重要。\n`;
  if (role === ROLES.VILLAGER) aiSystemPrompt += `你的目标是帮助找出并投票淘汰所有狼人。你没有特殊能力，需要通过分析其他玩家的发言和行为来判断他们的身份。\n`;
  aiSystemPrompt += `在适当的时候，你需要根据你的角色和获取到的信息（如查验结果、场上发言、投票情况）做出决策，例如选择攻击/守护/查验/用药的目标，或者在白天发言和投票。\n`;
  aiSystemPrompt += `你的回复应该简洁，符合角色。如果被要求提供ID，请只回复数字ID。如果被要求发言，请直接陈述。不要暴露你是AI。`;
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

export const initializePlayers = (gameConfig = { isRandomRole: true, selectedRole: null }) => {
  let rolesToAssign = [...ROLE_DISTRIBUTION];
  let humanId = Math.floor(Math.random() * PLAYER_COUNT);
  
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
      name: isHuman ? `玩家 ${index} (你)` : `玩家 ${index}`,
      role: role,
      isHuman: isHuman,
      aiSystemPrompt: createAISystemPrompt(role, index),
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