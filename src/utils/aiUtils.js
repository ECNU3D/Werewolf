import { ROLES } from '../constants/gameConstants';

export const getAIDecision = async (aiPlayer, promptPurpose, currentHistory_param, gameState) => {
  const { 
    players, 
    seerLastCheck, 
    guardLastProtectedId, 
    werewolfTargetId, 
    witchPotions, 
    humanPlayerId, 
    addLog 
  } = gameState;

  console.debug(`[AI_DECISION_START] AI 玩家 ${aiPlayer.id} (${aiPlayer.role}) | 任务: ${promptPurpose}`);
  let basePrompt = `${aiPlayer.aiSystemPrompt}\n`;
  basePrompt += `--- 当前游戏历史和状态 (越接近底部越新) ---\n${currentHistory_param.map(log => `${log.timestamp} [${log.type === 'human' ? `玩家 ${humanPlayerId}` : (log.type === 'ai' ? `玩家 ${aiPlayer.id}` : '系统')}] ${log.text}`).slice(-20).join('\n')}\n---\n`;
  
  const alivePlayerObjects = players.filter(p => p.isAlive);
  let alivePlayerInfo = "当前存活玩家列表:\n";
  alivePlayerObjects.forEach(p => {
      let roleDisplay = '未知身份';
      if (p.id === aiPlayer.id) {
          roleDisplay = p.role; 
      } else if (aiPlayer.role === ROLES.WEREWOLF && p.role === ROLES.WEREWOLF) {
          roleDisplay = `${ROLES.WEREWOLF} (你的同伴)`; 
      } else if (aiPlayer.role === ROLES.SEER && seerLastCheck && seerLastCheck.targetId === p.id) {
          roleDisplay = seerLastCheck.targetRole; 
      } else if (p.revealedRole) {
          roleDisplay = p.revealedRole;
      }
      alivePlayerInfo += `  - 玩家 ${p.id} (${p.isHuman ? "人类玩家" : "AI"}, 状态: 存活, 身份对你而言: ${roleDisplay})\n`;
  });
  basePrompt += alivePlayerInfo;
  
  if (aiPlayer.role === ROLES.WEREWOLF) {
      const otherWolves = players.filter(p => p.role === ROLES.WEREWOLF && p.id !== aiPlayer.id && p.isAlive);
      if (otherWolves.length > 0) {
          basePrompt += `你的狼人同伴是: ${otherWolves.map(w => `玩家 ${w.id}`).join(', ')}。\n`;
      } else {
          basePrompt += `你是场上唯一的狼人了。\n`;
      }
  }
  basePrompt += `你的ID是 ${aiPlayer.id}，你的身份是 ${aiPlayer.role}。\n`;

  let specificQuestion = "";
  let expectedFormat = "请直接回复你的选择。";

  switch (promptPurpose) {
    case 'WEREWOLF_TARGET':
      specificQuestion = `狼人任务：夜晚轮到你们狼人行动了。和你的狼同伴（如果有的话）一起选择一名玩家进行攻击。主要目标是好人阵营。你可以选择攻击任何玩家，但在特殊情况下（如迷惑好人），也可以考虑攻击狼人同伴。请只回复你选择攻击的目标玩家的ID数字。`;
      expectedFormat = "请只回复目标玩家的ID数字。";
      break;
    case 'GUARD_PROTECT':
      specificQuestion = `守卫任务：夜晚轮到你行动了。选择一名玩家进行守护，使其免受狼人攻击。你不能连续两晚守护同一个人。上一晚你守护的玩家是 ${guardLastProtectedId === null ? '无' : `玩家 ${guardLastProtectedId}`}。请只回复你选择守护的目标玩家的ID数字。`;
      expectedFormat = "请只回复目标玩家的ID数字。";
      break;
    case 'SEER_CHECK':
      specificQuestion = `预言家任务：夜晚轮到你行动了。选择一名玩家查验其身份（好人或狼人）。请只回复你选择查验的目标玩家的ID数字。`;
      expectedFormat = "请只回复目标玩家的ID数字。";
      break;
    case 'WITCH_SAVE_CHOICE': 
      const wolfVictim = players.find(p => p.id === werewolfTargetId);
      specificQuestion = `女巫任务：狼人攻击了玩家 ${werewolfTargetId} (${wolfVictim?.role || '未知身份'})。你有一瓶解药，${witchPotions.antidote ? '尚未使用' : '已经使用过了'}。你是否要对玩家 ${werewolfTargetId} 使用解药救他/她？请只回复 'yes' (使用) 或 'no' (不使用)。`;
      expectedFormat = "请只回复 'yes' 或 'no'。";
      break;
    case 'WITCH_POISON_CHOICE': 
      specificQuestion = `女巫任务：你有一瓶毒药，${witchPotions.poison ? '尚未使用' : '已经使用过了'}。你是否要在今晚使用毒药毒杀一名玩家？如果要使用，请回复目标玩家的ID数字；如果不想使用毒药，请回复 'no'。`;
      expectedFormat = "如果要使用，请回复目标玩家的ID数字；如果不使用，请回复 'no'。";
      break;
    case 'HUNTER_SHOOT':
      specificQuestion = `猎人任务：你（玩家 ${aiPlayer.id}）刚刚死亡了！现在你可以发动你的技能，开枪带走场上任意一名存活的玩家。请选择一名玩家与你一同出局，或者选择不开枪。如果要开枪，请只回复目标玩家的ID数字；如果选择不开枪，请回复 'no'。`;
      expectedFormat = "如果要开枪，请回复目标玩家的ID数字；如果选择不开枪，请回复 'no'。";
      break;
    case 'DISCUSSION_STATEMENT':
      specificQuestion = `讨论阶段：现在轮到你（玩家 ${aiPlayer.id} - ${aiPlayer.role}）发言了。请根据你已知的场上信息（包括你的身份、夜晚查验/行动结果、其他人的发言和投票历史）进行分析和表态。你的发言应该符合你的角色和阵营目标。例如，如果你是狼人，要隐藏身份，误导好人；如果你是预言家，要谨慎地给出信息。发言请简短，一两句话概括你的核心观点或行动意图。`;
      expectedFormat = "请直接回复你的发言内容。";
      break;
    case 'VOTE_PLAYER':
      specificQuestion = `投票阶段：现在轮到你（玩家 ${aiPlayer.id} - ${aiPlayer.role}）投票了。请根据所有信息，包括其他人的发言，投出你认为最应该是狼人或者对你的阵营最不利的玩家。请只回复你投票的目标玩家的ID数字。`;
      expectedFormat = "请只回复目标玩家的ID数字。";
      break;
    default:
      addLog(`AI ${aiPlayer.id} 收到未知行动类型: ${promptPurpose}`, 'error', true);
      console.error(`[AI ERROR] AI ${aiPlayer.id} 收到未知行动类型: ${promptPurpose}`);
      return null;
  }

  const fullPrompt = `${basePrompt}\n--- 你的任务 ---\n${specificQuestion}\n${expectedFormat}`;
  console.debug(`[AI_PROMPT_SENT] AI 玩家 ${aiPlayer.id} (${aiPlayer.role}) | 任务: ${promptPurpose}\n提示词内容:\n${fullPrompt}`);
  
  console.debug('[ENV_DEBUG] All environment variables:', process.env);
  console.debug('[ENV_DEBUG] REACT_APP variables:', Object.keys(process.env).filter(key => key.startsWith('REACT_APP_')));
  
  const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
  console.debug(`[API_KEY_CHECK] Raw value: "${apiKey}"`);
  console.debug(`[API_KEY_CHECK] Type: ${typeof apiKey}`);
  console.debug(`[API_KEY_CHECK] Length: ${apiKey ? apiKey.length : 'undefined'}`);
  console.debug(`[API_KEY_CHECK] Trimmed: "${apiKey ? apiKey.trim() : 'undefined'}"`);
  
  if (!apiKey || apiKey.trim() === '') {
    console.error("[API_ERROR] Gemini API key is not configured. Please set REACT_APP_GEMINI_API_KEY in your .env file.");
    addLog(`AI ${aiPlayer.id} (${promptPurpose}) API 密钥未配置。请检查环境变量。`, 'error', true);
    return null;
  }
  const modelName = "gemini-2.5-flash";
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
  
  const payload = {
    contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
    generationConfig: { stopSequences: ["\n"] }
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[API_ERROR] AI ${aiPlayer.id} (${promptPurpose}) | 状态: ${response.status} | 错误: ${errorBody}`);
      addLog(`AI ${aiPlayer.id} (${promptPurpose}) API 请求失败: ${response.status}.详情查看控制台。`, 'error', true);
      return null;
    }
    const result = await response.json();
    console.debug(`[AI_RAW_GEMINI_RESPONSE] AI 玩家 ${aiPlayer.id} (${promptPurpose}):\n${JSON.stringify(result, null, 2)}`);

    if (result.candidates && result.candidates.length > 0 &&
        result.candidates[0].content && result.candidates[0].content.parts &&
        result.candidates[0].content.parts.length > 0) {
      let text = result.candidates[0].content.parts[0].text.trim();
      console.debug(`[AI_EXTRACTED_TEXT_BEFORE_CLEAN] AI 玩家 ${aiPlayer.id} (${promptPurpose}): "${text}"`);
      text = text.replace(/`/g, '').replace(/\n/g, ' ').trim();
      console.debug(`[AI_CLEANED_RESPONSE] AI 玩家 ${aiPlayer.id} (${promptPurpose}): "${text}"`);
      
      if (promptPurpose.endsWith('_TARGET') || promptPurpose === 'SEER_CHECK' || promptPurpose === 'GUARD_PROTECT' || promptPurpose === 'VOTE_PLAYER') {
          if (!/^\d+$/.test(text)) {
              addLog(`AI ${aiPlayer.id} (${promptPurpose}) 回复格式无效 (应为数字ID): "${text}"`, 'error', false); 
              console.warn(`[AI_FORMAT_WARN] AI ${aiPlayer.id} (${promptPurpose}) 回复格式无效 (应为数字ID): "${text}"`);
              const numMatch = text.match(/\d+/);
              if (numMatch) text = numMatch[0]; else return null; 
          }
      } else if (promptPurpose === 'WITCH_SAVE_CHOICE' || promptPurpose === 'HUNTER_SHOOT' || promptPurpose === 'WITCH_POISON_CHOICE') {
          if (!/^(yes|no|\d+)$/i.test(text)) {
               addLog(`AI ${aiPlayer.id} (${promptPurpose}) 回复格式无效 (应为yes/no或ID): "${text}"`, 'error', false); 
               console.warn(`[AI_FORMAT_WARN] AI ${aiPlayer.id} (${promptPurpose}) 回复格式无效 (应为yes/no或ID): "${text}"`);
               if (text.toLowerCase().includes('yes')) text = 'yes';
               else if (text.toLowerCase().includes('no')) text = 'no';
               else { const numMatch = text.match(/\d+/); if (numMatch) text = numMatch[0]; else return null;}
          }
      }
      return text;
    } else {
      console.error(`[API_ERROR] AI ${aiPlayer.id} (${promptPurpose}) API 响应结构意外:`, result);
      addLog(`AI ${aiPlayer.id} (${promptPurpose}) API 响应结构意外。详情查看控制台。`, 'error', true);
      if (result.promptFeedback && result.promptFeedback.blockReason) {
          addLog(`AI ${aiPlayer.id} Prompt blocked: ${result.promptFeedback.blockReason}`, 'error', true);
          console.error(`[API_PROMPT_FEEDBACK] AI ${aiPlayer.id} Prompt blocked: ${result.promptFeedback.blockReason} | Details: ${JSON.stringify(result.promptFeedback.safetyRatings)}`);
      }
      return null; 
    }
  } catch (error) {
    console.error(`[API_CATCH_ERROR] 调用 Gemini API 时出错 (AI ${aiPlayer.id}, ${promptPurpose}):`, error);
    addLog(`AI ${aiPlayer.id} (${promptPurpose}) 思考出错: ${error.message}`, 'error', true);
    return null;
  }
}; 