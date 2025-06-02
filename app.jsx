import React, { useState, useEffect, useCallback, useRef } from 'react';

// Tailwind CSS is assumed to be available globally
// <script src="https://cdn.tailwindcss.com"></script>

const ROLES = {
  WEREWOLF: '狼人',
  SEER: '预言家',
  WITCH: '女巫',
  HUNTER: '猎人',
  GUARD: '守卫',
  VILLAGER: '平民',
};

const PLAYER_COUNT = 8;
const ROLE_DISTRIBUTION = [
  ROLES.WEREWOLF, ROLES.WEREWOLF,
  ROLES.SEER, ROLES.WITCH, ROLES.HUNTER, ROLES.GUARD,
  ROLES.VILLAGER, ROLES.VILLAGER,
];

const INITIAL_PLAYER_STATE = {
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

const GAME_PHASES = {
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

const App = () => {
  // 1. useState hooks
  const [players, setPlayers] = useState([]);
  const [humanPlayerId, setHumanPlayerId] = useState(0);
  const [gamePhase, setGamePhase] = useState(GAME_PHASES.SETUP);
  const [gameLog, setGameLog] = useState([]);
  const [showRoleModalState, setShowRoleModalState] = useState(false);
  const [witchPotions, setWitchPotions] = useState({ antidote: true, poison: true });
  const [guardLastProtectedId, setGuardLastProtectedId] = useState(null);
  const [seerLastCheck, setSeerLastCheck] = useState(null); 
  const [werewolfTargetId, setWerewolfTargetId] = useState(null);
  const [playerToPoisonId, setPlayerToPoisonId] = useState(null);
  const [hunterTargetId, setHunterTargetId] = useState(null);
  const [pendingDeathPlayerIds, setPendingDeathPlayerIds] = useState([]); 
  const [currentPlayerSpeakingId, setCurrentPlayerSpeakingId] = useState(0); 
  const [currentVotes, setCurrentVotes] = useState({}); 
  const [winner, setWinner] = useState(null); 

  const recognitionRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const [humanPlayerSpeech, setHumanPlayerSpeech] = useState('');
  const isProcessingStepRef = useRef(false); 

  // 2. useCallback-wrapped functions & other functions

  const addLog = useCallback((message, type = 'system', uiVisible = true) => {
    console.log(`[LOG][${type}] ${message}`); 
    if (uiVisible) {
        setGameLog(prevLog => [...prevLog, { text: message, type, timestamp: new Date().toLocaleTimeString() }]);
    }
  }, []); 

  const getAIDecision = useCallback(async (aiPlayer, promptPurpose, currentHistory_param) => { 
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
    
    const apiKey = ""; 
    const modelName = "gemini-2.0-flash";
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
  }, [addLog, players, seerLastCheck, guardLastProtectedId, werewolfTargetId, witchPotions.antidote, witchPotions.poison, humanPlayerId]);


  const checkWinCondition = useCallback((currentPlayersToCheck) => {
    const alivePlayers = currentPlayersToCheck.filter(p => p.isAlive);
    if (alivePlayers.length === 0 && !winner) { 
        addLog('所有玩家都已死亡！游戏平局或出现错误！', 'system', true);
        setWinner('DRAW'); 
        setGamePhase(GAME_PHASES.GAME_OVER);
        return false;
    }
    const aliveWerewolves = alivePlayers.filter(p => p.role === ROLES.WEREWOLF);
    const aliveGodsAndVillagers = alivePlayers.filter(p => p.role !== ROLES.WEREWOLF);
    if (aliveWerewolves.length === 0 && !winner) {
      addLog('所有狼人已被消灭！平民阵营胜利！', 'system', true);
      setWinner('VILLAGERS');
      setGamePhase(GAME_PHASES.GAME_OVER);
      return false;
    }
    if (aliveWerewolves.length >= aliveGodsAndVillagers.length && !winner) {
      addLog('狼人数量达到或超过好人数量！狼人阵营胜利！', 'system', true);
      setWinner('WEREWOLVES');
      setGamePhase(GAME_PHASES.GAME_OVER);
      return false;
    }
    return true; 
  }, [addLog, winner, setWinner, setGamePhase]); 

  const resolveNightActions = useCallback(() => {
    console.debug("[RESOLVE_NIGHT_ACTIONS] Starting night resolution.");
    let deathsThisNightInfo = []; 
    let messagesForUILog = []; 
    let updatedPlayers = [...players]; 
    const wolfTargetPlayer = updatedPlayers.find(p => p.id === werewolfTargetId);

    if (wolfTargetPlayer && wolfTargetPlayer.isAlive) {
      if (wolfTargetPlayer.isProtected) {
        messagesForUILog.push(`玩家 ${wolfTargetPlayer.id} 被狼人攻击，但被守卫保护了！`);
      } else if (wolfTargetPlayer.isHealedByWitch) {
        messagesForUILog.push(`玩家 ${wolfTargetPlayer.id} 被狼人攻击，但被女巫用解药救活了！`);
      } else {
        messagesForUILog.push(`昨晚，玩家 ${wolfTargetPlayer.id} 被杀害了。`); 
        deathsThisNightInfo.push({ id: wolfTargetPlayer.id, role: wolfTargetPlayer.role, reason: '狼人杀害' });
      }
    } else if (werewolfTargetId !== null) {
       messagesForUILog.push("昨晚狼人似乎没有得手，或者目标已经死亡。");
    } else {
       messagesForUILog.push("昨晚是个平安夜（狼人没有选择目标）。");
    }

    const poisonedPlayer = updatedPlayers.find(p => p.id === playerToPoisonId);
    if (poisonedPlayer && poisonedPlayer.isAlive) {
      const alreadyMarkedForDeathByWolf = deathsThisNightInfo.some(d => d.id === poisonedPlayer.id);
      if (!alreadyMarkedForDeathByWolf) {
         messagesForUILog.push(`玩家 ${poisonedPlayer.id} 被女巫毒杀了。`); 
         deathsThisNightInfo.push({ id: poisonedPlayer.id, role: poisonedPlayer.role, reason: '女巫毒杀' });
      } else {
         deathsThisNightInfo = deathsThisNightInfo.filter(d => d.id !== poisonedPlayer.id); 
         messagesForUILog.push(`玩家 ${poisonedPlayer.id} 被女巫毒杀了 (也可能曾是狼人目标)。`);
         deathsThisNightInfo.push({ id: poisonedPlayer.id, role: poisonedPlayer.role, reason: '女巫毒杀' });
      }
    }
    
    let actualDeadIdsThisNight = [];
    if (deathsThisNightInfo.length === 0) {
      if (werewolfTargetId === null && playerToPoisonId === null && messagesForUILog.length === 0) { 
        messagesForUILog.push("昨晚是平安夜，无人死亡。");
      } else if (messagesForUILog.length === 0 && (werewolfTargetId !== null || playerToPoisonId !== null)) {
        if (werewolfTargetId === null && playerToPoisonId === null) { 
             messagesForUILog.push("昨晚行动过后，无人死亡。"); 
        }
      }
    } else {
        deathsThisNightInfo.forEach(death => {
            const deadPlayerIndex = updatedPlayers.findIndex(p => p.id === death.id);
            if (deadPlayerIndex !== -1 && updatedPlayers[deadPlayerIndex].isAlive) {
                updatedPlayers[deadPlayerIndex].isAlive = false;
                updatedPlayers[deadPlayerIndex].revealedRole = death.role; 
                actualDeadIdsThisNight.push(death.id);
            }
        });
    }
    messagesForUILog.forEach(msg => addLog(msg, 'system', true)); 

    setPlayers(updatedPlayers);
    setPendingDeathPlayerIds(actualDeadIdsThisNight); 
    
    const gameStillOn = checkWinCondition(updatedPlayers);
    if (gameStillOn) {
      setGamePhase(GAME_PHASES.DAY_START);
    }
    console.debug("[RESOLVE_NIGHT_ACTIONS] Finished night resolution.");
  }, [players, werewolfTargetId, playerToPoisonId, addLog, checkWinCondition, setPlayers, setPendingDeathPlayerIds, setGamePhase]);

  const resolveVoting = useCallback(() => {
    console.debug("[RESOLVE_VOTING] Starting vote resolution.");
    let maxVotes = 0;
    let playersWithMaxVotesIds = [];
    const voteCounts = players.reduce((acc, player) => {
      if (player.isAlive) acc[player.id] = 0;
      return acc;
    }, {});
    Object.values(currentVotes).forEach(votedPlayerId => {
      if (votedPlayerId !== null && voteCounts.hasOwnProperty(votedPlayerId)) {
        voteCounts[votedPlayerId]++;
      }
    });
    players.forEach(player => {
      if (player.isAlive) {
        const count = voteCounts[player.id] || 0;
        if (count > maxVotes) {
          maxVotes = count;
          playersWithMaxVotesIds = [player.id];
        } else if (count === maxVotes && maxVotes > 0) {
          playersWithMaxVotesIds.push(player.id);
        }
      }
    });

    let eliminatedPlayerId = null;
    let updatedPlayers = [...players];
    let voteMessage = "";

    if (playersWithMaxVotesIds.length === 1 && maxVotes > 0) {
      eliminatedPlayerId = playersWithMaxVotesIds[0];
      const eliminatedPlayerIndex = updatedPlayers.findIndex(p => p.id === eliminatedPlayerId);
      if (eliminatedPlayerIndex !== -1) {
        updatedPlayers[eliminatedPlayerIndex].isAlive = false;
        updatedPlayers[eliminatedPlayerIndex].revealedRole = updatedPlayers[eliminatedPlayerIndex].role;
        voteMessage = `玩家 ${eliminatedPlayerId} (${updatedPlayers[eliminatedPlayerIndex].role}) 被投票出局！`;
      }
    } else if (playersWithMaxVotesIds.length > 1) {
      voteMessage = '投票出现平票，本轮无人出局。';
    } else {
      voteMessage = '无人获得足够票数，或无人投票，本轮无人出局。';
    }
    addLog(voteMessage, 'system', true);

    setPlayers(updatedPlayers);
    const gameStillOn = checkWinCondition(updatedPlayers);

    if (gameStillOn) {
      const eliminatedPlayer = updatedPlayers.find(p => p.id === eliminatedPlayerId);
      if (eliminatedPlayer && eliminatedPlayer.role === ROLES.HUNTER && !eliminatedPlayer.isAlive) {
        setHunterTargetId(null);
        setGamePhase(GAME_PHASES.HUNTER_MAY_ACT);
      } else {
        setGamePhase(GAME_PHASES.NIGHT_START);
      }
    }
    setCurrentVotes({});
    console.debug("[RESOLVE_VOTING] Finished vote resolution.");
  }, [players, currentVotes, addLog, checkWinCondition, setPlayers, setGamePhase, setCurrentVotes, setHunterTargetId]);
  
  const handleNextSpeaker = useCallback(() => {
    if (winner) return;
    const alivePlayers = players.filter(p => p.isAlive);
    if (alivePlayers.length === 0) {
        console.debug("[HANDLE_NEXT_SPEAKER] No alive players, attempting to go to voting.");
        setGamePhase(GAME_PHASES.VOTING); 
        return;
    }
    
    console.debug(`[HANDLE_NEXT_SPEAKER_ENTRY] Current speaker ID (state): ${currentPlayerSpeakingId}`);
    let currentSpokenPlayerOrder = -1; 
    for(let i=0; i < alivePlayers.length; i++) {
        if(alivePlayers[i].id === currentPlayerSpeakingId) { 
            currentSpokenPlayerOrder = i;
            break;
        }
    }
    console.debug(`[HANDLE_NEXT_SPEAKER] Current speaker's order in alive list: ${currentSpokenPlayerOrder} (Player ID: ${currentPlayerSpeakingId})`);
    
    let nextSpeakerToSetId;
    if (currentSpokenPlayerOrder === -1 && alivePlayers.length > 0 ) { 
        nextSpeakerToSetId = alivePlayers[0].id;
        console.debug(`[HANDLE_NEXT_SPEAKER] Current speaker not found or initial, setting to first alive: Player ID ${nextSpeakerToSetId}`);
    } else if (currentSpokenPlayerOrder < alivePlayers.length - 1) { 
        nextSpeakerToSetId = alivePlayers[currentSpokenPlayerOrder + 1].id;
        console.debug(`[HANDLE_NEXT_SPEAKER] Moving to next alive player in list: Player ID ${nextSpeakerToSetId}`);
    } else { 
      console.debug("[HANDLE_NEXT_SPEAKER] All alive players have spoken, moving to VOTING phase.");
      addLog('所有存活玩家发言完毕，进入投票阶段。', 'system', true); 
      setGamePhase(GAME_PHASES.VOTING); 
      return;
    }
    
    console.debug(`[HANDLE_NEXT_SPEAKER_SETTING] Setting next speaker to Player ID: ${nextSpeakerToSetId}`);
    setCurrentPlayerSpeakingId(nextSpeakerToSetId); 

    const nextSpeakerDetails = players.find(p => p.id === nextSpeakerToSetId);
    if (nextSpeakerDetails) {
        addLog(`轮到玩家 ${nextSpeakerDetails.id} 发言。`, 'system', true);
    } else {
        console.error(`[HANDLE_NEXT_SPEAKER_ERROR] Could not find next speaker details for ID: ${nextSpeakerToSetId}`);
    }
  }, [currentPlayerSpeakingId, players, winner, addLog, setGamePhase, setCurrentPlayerSpeakingId]); 

  const initializeGame = useCallback(() => {
    addLog('游戏初始化...', 'system', true);
    let rolesToAssign = [...ROLE_DISTRIBUTION];
    for (let i = rolesToAssign.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rolesToAssign[i], rolesToAssign[j]] = [rolesToAssign[j], rolesToAssign[i]];
    }
    const humanId = Math.floor(Math.random() * PLAYER_COUNT);
    setHumanPlayerId(humanId);
    const newPlayers = Array(PLAYER_COUNT).fill(null).map((_, index) => {
      const role = rolesToAssign[index];
      const isHuman = index === humanId;
      let aiSystemPrompt = `你正在一个在线文字狼人杀游戏中扮演一名AI玩家。你的玩家ID是 ${index}。\n`;
      aiSystemPrompt += `你的身份是 ${role}。\n`;
      if (role === ROLES.WEREWOLF) aiSystemPrompt += `你的目标是消灭所有神民阵营的玩家（预言家, 女巫, 猎人, 守卫, 平民）。夜晚与狼同伴一起选择一名玩家进行攻击。白天隐藏身份，误导好人，避免被投票出局。\n`;
      if (role === ROLES.SEER) aiSystemPrompt += `你的目标是找出所有狼人。每晚可以查验一名玩家的身份（狼人或好人）。白天你需要用你的信息引导好人投票，但要小心不要过早暴露自己而被狼人杀死。\n`;
      if (role === ROLES.WITCH) aiSystemPrompt += `你有一瓶解药和一瓶毒药，每种药剂整局游戏只能使用一次。解药可以在夜晚救一名被狼人攻击的玩家。毒药可以在夜晚毒杀一名玩家。你需要谨慎使用你的药剂。\n`;
      if (role === ROLES.GUARD) aiSystemPrompt += `你的目标是保护好人阵营。每晚可以守护一名玩家免受狼人攻击，但不能连续两晚守护同一个人。你需要判断谁最可能成为狼人的目标，或者谁对好人阵营最重要。\n`;
      if (role === ROLES.HUNTER) aiSystemPrompt += `当你死亡时（无论是被狼人杀害还是被投票出局），你可以选择开枪带走场上任何一名存活的玩家。你需要判断谁是狼人，或者谁对狼人阵营最重要。\n`;
      if (role === ROLES.VILLAGER) aiSystemPrompt += `你的目标是帮助找出并投票淘汰所有狼人。你没有特殊能力，需要通过分析其他玩家的发言和行为来判断他们的身份。\n`;
      aiSystemPrompt += `在适当的时候，你需要根据你的角色和获取到的信息（如查验结果、场上发言、投票情况）做出决策，例如选择攻击/守护/查验/用药的目标，或者在白天发言和投票。\n`;
      aiSystemPrompt += `你的回复应该简洁，符合角色。如果被要求提供ID，请只回复数字ID。如果被要求发言，请直接陈述。不要暴露你是AI。`;
      return {
        ...INITIAL_PLAYER_STATE,
        id: index,
        name: isHuman ? `玩家 ${index} (你)` : `玩家 ${index}`,
        role: role,
        isHuman: isHuman,
        aiSystemPrompt: aiSystemPrompt,
      };
    });
    setPlayers(newPlayers);
    addLog('游戏开始！身份已分配。', 'system', true);
    setShowRoleModalState(true); 
    setWitchPotions({ antidote: true, poison: true });
    setGuardLastProtectedId(null);
    setSeerLastCheck(null);
    setWerewolfTargetId(null);
    setPlayerToPoisonId(null);
    setHunterTargetId(null);
    setPendingDeathPlayerIds([]);
    const firstAlivePlayer = newPlayers.find(p => p.isAlive);
    setCurrentPlayerSpeakingId(firstAlivePlayer ? firstAlivePlayer.id : 0); 
    setCurrentVotes({});
    setWinner(null);
    setGamePhase(GAME_PHASES.SHOW_ROLE_MODAL); 
  }, [addLog, setPlayers, setHumanPlayerId, setGameLog, setShowRoleModalState, setWitchPotions, setGuardLastProtectedId, setSeerLastCheck, setWerewolfTargetId, setPlayerToPoisonId, setHunterTargetId, setPendingDeathPlayerIds, setCurrentPlayerSpeakingId, setCurrentVotes, setWinner, setGamePhase]); 

  const handleAIVoting = async () => {
    console.debug("[HANDLE_AI_VOTING] Starting AI voting process.");
    const aliveAIPlayers = players.filter(p => p.isAlive && !p.isHuman);
    let newVotesCollectedThisTurn = {}; // Collect new votes here
    let anyNewVotes = false;

    for (const aiPlayer of aliveAIPlayers) {
        // Only process AI if they haven't voted yet
        if (!currentVotes.hasOwnProperty(aiPlayer.id)) {
            const aiVoteTargetIdStr = await getAIDecision(aiPlayer, 'VOTE_PLAYER', gameLog);
            const aiVoteTargetId = parseInt(aiVoteTargetIdStr, 10);
            if (!isNaN(aiVoteTargetId) && players.find(p => p.id === aiVoteTargetId)?.isAlive && aiVoteTargetId !== aiPlayer.id) {
                newVotesCollectedThisTurn[aiPlayer.id] = aiVoteTargetId;
                addLog(`玩家 ${aiPlayer.id} 投票给玩家 ${aiVoteTargetId}。`, 'ai', true);
                anyNewVotes = true;
            } else {
                const possibleTargets = players.filter(p => p.isAlive && p.id !== aiPlayer.id);
                if (possibleTargets.length > 0) {
                    const randomTarget = possibleTargets[Math.floor(Math.random() * possibleTargets.length)].id;
                    newVotesCollectedThisTurn[aiPlayer.id] = randomTarget;
                    addLog(`玩家 ${aiPlayer.id} (随机) 投票给玩家 ${randomTarget}。`, 'ai', true);
                    anyNewVotes = true;
                } else {
                    newVotesCollectedThisTurn[aiPlayer.id] = null; // Explicitly mark as abstained if no valid target
                    addLog(`玩家 ${aiPlayer.id} 弃票 (无有效目标)。`, 'ai', true);
                    anyNewVotes = true;
                }
            }
        }
    }
    
    if (anyNewVotes) {
        setCurrentVotes(prevVotes => ({ ...prevVotes, ...newVotesCollectedThisTurn }));
    }
    console.debug("[HANDLE_AI_VOTING] Finished AI voting process. Current votes:", currentVotes, "New votes collected:", newVotesCollectedThisTurn);
    // The decision to move to VOTE_RESULTS will be handled by the main useEffect
  };

  const handlePlayerAction = async (actionType, targetId) => {
    if (winner || isProcessingStepRef.current) return; 

    isProcessingStepRef.current = true; 
    console.debug(`[HANDLE_PLAYER_ACTION] Action: ${actionType}, Target: ${targetId}, Current Phase: ${gamePhase}`);
    const humanPlayer = players.find(p => p.isHuman);
    if (!humanPlayer || !humanPlayer.isAlive && !(humanPlayer.role === ROLES.HUNTER && gamePhase === GAME_PHASES.HUNTER_MAY_ACT)) {
        addLog("你无法行动。", 'system', true); 
        isProcessingStepRef.current = false;
        return;
    }
    let nextPhaseToSet = null;

    switch (gamePhase) {
      case GAME_PHASES.WEREWOLVES_ACT:
        if (humanPlayer.role === ROLES.WEREWOLF) {
          if (targetId === null || targetId === undefined) { addLog("你需要选择一个目标。", 'system', true); isProcessingStepRef.current = false; return; }
          const targetPlayer = players.find(p => p.id === targetId);
          if (!targetPlayer || !targetPlayer.isAlive) { addLog("目标无效或已死亡。", 'system', true); isProcessingStepRef.current = false; return; }
          setWerewolfTargetId(targetId);
          addLog(`你选择了攻击玩家 ${targetId}。`, 'human', true);
          nextPhaseToSet = GAME_PHASES.GUARD_ACTS; 
        }
        break;
      case GAME_PHASES.GUARD_ACTS:
        if (humanPlayer.role === ROLES.GUARD) {
          if (targetId === null || targetId === undefined) { addLog("你需要选择守护一名玩家。", 'system', true); isProcessingStepRef.current = false; return; }
          if (targetId === guardLastProtectedId) { addLog("不能连续两晚守护同一个人。", 'system', true); isProcessingStepRef.current = false; return; }
          const targetPlayer = players.find(p => p.id === targetId);
          if (!targetPlayer || !targetPlayer.isAlive) { addLog("目标无效或已死亡。", 'system', true); isProcessingStepRef.current = false; return; }
          setPlayers(prev => prev.map(p => p.id === targetId ? { ...p, isProtected: true } : p));
          setGuardLastProtectedId(targetId);
          addLog(`你选择了守护玩家 ${targetId}。`, 'human', true);
          nextPhaseToSet = GAME_PHASES.SEER_ACTS;
        }
        break;
      case GAME_PHASES.SEER_ACTS:
        if (humanPlayer.role === ROLES.SEER) {
          if (targetId === null || targetId === undefined) { addLog("你需要选择查验一名玩家。", 'system', true); isProcessingStepRef.current = false; return; }
          const targetPlayer = players.find(p => p.id === targetId);
          if (!targetPlayer) { addLog("目标无效。", 'system', true); isProcessingStepRef.current = false; return; } 
          if (!targetPlayer.isAlive) { addLog("通常只能查验存活的玩家。", 'system', true); isProcessingStepRef.current = false; return;}
          const revealedRole = targetPlayer.role;
          setSeerLastCheck({ targetId, targetRole: revealedRole });
          console.info(`[SEER PRIVATE] 玩家 ${humanPlayerId} (预言家) 查验玩家 ${targetId}: ${revealedRole}`);
          addLog(`你查验了玩家 ${targetId}。`, 'human', true); 
          nextPhaseToSet = GAME_PHASES.WITCH_ACTS_SAVE;
        }
        break;
      case GAME_PHASES.WITCH_ACTS_SAVE:
        if (humanPlayer.role === ROLES.WITCH) { 
          const targetPlayer = players.find(p => p.id === werewolfTargetId);
          if (actionType === 'USE_ANTIDOTE' && witchPotions.antidote) {
            if (!targetPlayer || !targetPlayer.isAlive || !werewolfTargetId) {
                addLog("无人被狼人攻击，或目标已死亡，无法使用解药。", 'system', true);
            } else {
                setPlayers(prev => prev.map(p => p.id === werewolfTargetId ? { ...p, isHealedByWitch: true } : p));
                setWitchPotions(prev => ({ ...prev, antidote: false }));
                addLog(`你对玩家 ${werewolfTargetId} 使用了解药。`, 'human', true);
            }
          } else if (actionType === 'SKIP_ANTIDOTE' || !witchPotions.antidote) { 
            addLog(`你选择不使用解药${!witchPotions.antidote ? ' (已无解药)' : ''}。`, 'human', true);
          }
        }
        setGamePhase(GAME_PHASES.WITCH_ACTS_POISON); 
        isProcessingStepRef.current = false;
        return; 
      case GAME_PHASES.WITCH_ACTS_POISON:
        if (humanPlayer.role === ROLES.WITCH) {
          if (actionType === 'USE_POISON' && targetId !== null && witchPotions.poison) {
            const targetPlayer = players.find(p => p.id === targetId);
            if (!targetPlayer || !targetPlayer.isAlive) { addLog("目标无效或已死亡。", 'system', true); isProcessingStepRef.current = false; return; }
            if (targetPlayer.id === humanPlayer.id) { addLog("女巫不能毒自己。", 'system', true); isProcessingStepRef.current = false; return;}
            setPlayerToPoisonId(targetId);
            setWitchPotions(prev => ({ ...prev, poison: false }));
            addLog(`你对玩家 ${targetId} 使用了毒药。`, 'human', true);
          } else if (actionType === 'SKIP_POISON' || !witchPotions.poison) {
            addLog(`你选择不使用毒药${!witchPotions.poison ? ' (已无毒药)' : ''}。`, 'human', true);
            setPlayerToPoisonId(null);
          }
        }
        nextPhaseToSet = GAME_PHASES.NIGHT_RESOLUTION;
        break;
      case GAME_PHASES.HUNTER_MAY_ACT:
        const deadOrVotedHunter = players.find(p => p.id === humanPlayer.id && p.role === ROLES.HUNTER && !p.isAlive);
        if (deadOrVotedHunter) {
            if (actionType === 'HUNTER_SHOOT' && targetId !== null) {
                const targetPlayer = players.find(p => p.id === targetId);
                if (!targetPlayer || !targetPlayer.isAlive) { addLog("目标无效或已死亡。", 'system', true); isProcessingStepRef.current = false; return; }
                if (targetPlayer.id === deadOrVotedHunter.id) { addLog("猎人不能射杀自己。", 'system', true); isProcessingStepRef.current = false; return; }
                let updatedPlayersState = players.map(p => p.id === targetId ? { ...p, isAlive: false, revealedRole: p.role } : p);
                setPlayers(updatedPlayersState); 
                addLog(`你 (猎人) 开枪带走了玩家 ${targetId} (${targetPlayer.role})！`, 'human', true);
                setHunterTargetId(targetId); 
                if (!checkWinCondition(updatedPlayersState)) { isProcessingStepRef.current = false; return; }
            } else { 
                addLog(`你 (猎人) 选择不开枪。`, 'human', true);
            }
        }
        nextPhaseToSet = GAME_PHASES.DISCUSSION; 
        break;
      case GAME_PHASES.VOTING:
        if (humanPlayer.isAlive) {
            if (targetId === null || targetId === undefined) { addLog("你需要选择投票给一名玩家。", 'system', true); setIsProcessingStepRef.current = false; return; }
            const targetPlayer = players.find(p => p.id === targetId);
            if (!targetPlayer || !targetPlayer.isAlive) { addLog("目标无效或已死亡。", 'system', true); setIsProcessingStepRef.current = false; return; }
            if (targetPlayer.id === humanPlayer.id) { addLog("你不能投票给自己。", 'system', true); setIsProcessingStepRef.current = false; return; }
            
            setCurrentVotes(prev => ({ ...prev, [humanPlayer.id]: targetId })); 
            addLog(`你投票给了玩家 ${targetId}。`, 'human', true);
            
            // Ensure AI voting is triggered and awaited here, so the main useEffect can check completion.
            // The main useEffect will then handle the phase transition.
            await handleAIVoting(); 
            isProcessingStepRef.current = false; // Release lock after human action (and subsequent AI voting if any) is done
            return; // Important: prevent falling through to setGamePhase which is now handled by useEffect
        }
        break;
      default:
        isProcessingStepRef.current = false;
        return;
    }

    if (nextPhaseToSet && nextPhaseToSet !== gamePhase) {
        setGamePhase(nextPhaseToSet);
    }
    isProcessingStepRef.current = false;
  };

  // 3. useEffect hooks
  useEffect(() => { 
    let recognitionInstance;
    if (typeof window !== 'undefined' && (typeof window.SpeechRecognition !== 'undefined' || typeof window.webkitSpeechRecognition !== 'undefined')) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'zh-CN';
      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setHumanPlayerSpeech(transcript);
        addLog(`你 (玩家 ${humanPlayerId}) 说: ${transcript}`, 'human', true);
        setIsListening(false);
        if (gamePhase === GAME_PHASES.DISCUSSION) {
          handleNextSpeaker();
        }
      };
      recognitionInstance.onerror = (event) => {
        let errorMessage = '未知语音识别错误';
        if (event.error) {
          errorMessage = `语音识别错误: ${event.error}`;
          console.error('Detailed speech recognition error:', event.error); 
        } else {
          console.error('Generic speech recognition error object:', event); 
        }
        addLog(`${errorMessage}. 请尝试手动输入或检查麦克风权限。`, 'error', true);
        setIsListening(false);
      };
      recognitionInstance.onend = () => {
        setIsListening(false);
      };
      recognitionRef.current = recognitionInstance;
    } else {
      addLog('您的浏览器不支持语音识别。请手动输入发言。', 'system', true);
    }
    return () => {
      if (recognitionInstance) {
        recognitionInstance.onresult = null;
        recognitionInstance.onerror = null;
        recognitionInstance.onend = null;
        recognitionInstance.stop(); 
        recognitionInstance = null;
      }
    };
  }, [humanPlayerId, gamePhase, addLog, handleNextSpeaker]); 

  // Main Game Logic Controller
  useEffect(() => {
    const executeCurrentStep = async () => {
        if (winner) {
            console.debug("[EXECUTE_CURRENT_STEP] Game over, winner declared. Skipping.");
            return;
        }
        if (isProcessingStepRef.current && gamePhase !== GAME_PHASES.SETUP && gamePhase !== GAME_PHASES.SHOW_ROLE_MODAL) { 
            console.debug(`[EXECUTE_CURRENT_STEP] Skipping because isProcessingStepRef.current is true. Phase: ${gamePhase}`);
            return;
        }
        
        console.debug(`[EXECUTE_CURRENT_STEP] START. Phase: ${gamePhase}, Current Speaker: ${currentPlayerSpeakingId}`);
        isProcessingStepRef.current = true;

        const currentPlayers_local = players; 
        const currentHumanPlayer_local = currentPlayers_local.find(p => p.isHuman);
        const currentLog_local = gameLog;
        const currentPhase_local = gamePhase; 

        try {
            switch (currentPhase_local) { 
                case GAME_PHASES.SETUP:
                    console.debug("[EXECUTE_CURRENT_STEP] In SETUP phase.");
                    if (currentPlayers_local.length === 0) initializeGame(); 
                    break;
                case GAME_PHASES.SHOW_ROLE_MODAL:
                    console.debug("[EXECUTE_CURRENT_STEP] In SHOW_ROLE_MODAL phase, waiting for modal.");
                    break;
                case GAME_PHASES.NIGHT_START:
                    console.debug("[EXECUTE_CURRENT_STEP] In NIGHT_START phase.");
                    if (!showRoleModalState) { 
                        addLog('夜幕降临，请闭眼。狼人请行动。', 'system', true);
                        setWerewolfTargetId(null); 
                        setPlayerToPoisonId(null); 
                        setPlayers(prev => prev.map(p => ({ ...p, isProtected: false, isTargetedByWolf: false, isHealedByWitch: false })));
                        console.debug(`[NIGHT_START_LOGIC] About to set gamePhase to WEREWOLVES_ACT from NIGHT_START. Current phase: ${currentPhase_local}`);
                        setGamePhase(GAME_PHASES.WEREWOLVES_ACT);
                    } else {
                        console.debug("[EXECUTE_CURRENT_STEP] NIGHT_START: showRoleModalState is true, waiting.");
                    }
                    break;
                
                case GAME_PHASES.WEREWOLVES_ACT:
                    console.debug("[EXECUTE_CURRENT_STEP] In WEREWOLVES_ACT phase.");
                    if (currentHumanPlayer_local?.role === ROLES.WEREWOLF && currentHumanPlayer_local.isAlive && werewolfTargetId === null) {
                        addLog('等待你（狼人）选择攻击目标...', 'system', true);
                    } else {
                        const aiWolves = currentPlayers_local.filter(p => p.role === ROLES.WEREWOLF && p.isAlive && !p.isHuman);
                        if (aiWolves.length > 0 && werewolfTargetId === null) {
                            const actingWolf = aiWolves[0];
                            const targetStr = await getAIDecision(actingWolf, 'WEREWOLF_TARGET', currentLog_local);
                            const target = parseInt(targetStr, 10);
                            if (!isNaN(target) && currentPlayers_local.find(p => p.id === target)?.isAlive) {
                                setWerewolfTargetId(target); 
                                console.info(`[AI DEBUG] AI 狼人 (玩家 ${actingWolf.id}) 选择了攻击玩家 ${target}。`);
                            } else { /* fallback */ }
                        }
                        if (werewolfTargetId !== null || (aiWolves.length === 0 && !(currentHumanPlayer_local?.role === ROLES.WEREWOLF && currentHumanPlayer_local?.isAlive))) {
                            addLog('狼人行动结束。守卫请行动。', 'system', true);
                            setGamePhase(GAME_PHASES.GUARD_ACTS);
                        }
                    }
                    break;
                case GAME_PHASES.GUARD_ACTS:
                    console.debug("[EXECUTE_CURRENT_STEP] In GUARD_ACTS phase.");
                    if (currentHumanPlayer_local?.role === ROLES.GUARD && currentHumanPlayer_local.isAlive) {
                        // Waiting for human guard action
                    } else {
                        const guard = currentPlayers_local.find(p => p.role === ROLES.GUARD && p.isAlive && !p.isHuman);
                        if (guard) {
                            const targetStr = await getAIDecision(guard, 'GUARD_PROTECT', currentLog_local);
                            const target = parseInt(targetStr, 10);
                            if (!isNaN(target) && target !== guardLastProtectedId && currentPlayers_local.find(p => p.id === target)?.isAlive) {
                                setPlayers(prev => prev.map(p => p.id === target ? { ...p, isProtected: true } : p));
                                setGuardLastProtectedId(target);
                                console.info(`[AI DEBUG] AI 守卫 (玩家 ${guard.id}) 选择了守护玩家 ${target}。`);
                            } else { /* fallback */ }
                        }
                        addLog('守卫行动结束。预言家请行动。', 'system', true);
                        setGamePhase(GAME_PHASES.SEER_ACTS);
                    }
                    break;
                case GAME_PHASES.SEER_ACTS:
                    console.debug("[EXECUTE_CURRENT_STEP] In SEER_ACTS phase.");
                     if (currentHumanPlayer_local?.role === ROLES.SEER && currentHumanPlayer_local.isAlive) {
                        // Waiting for human seer action
                    } else {
                        const seerAI = currentPlayers_local.find(p => p.role === ROLES.SEER && p.isAlive && !p.isHuman);
                        if (seerAI) {
                            const targetStr = await getAIDecision(seerAI, 'SEER_CHECK', currentLog_local);
                            const target = parseInt(targetStr, 10);
                            const targetPlayer = currentPlayers_local.find(p => p.id === target);
                            if (targetPlayer?.isAlive) {
                                setSeerLastCheck({ targetId: target, targetRole: targetPlayer.role });
                                console.info(`[AI DEBUG] AI 预言家 (玩家 ${seerAI.id}) 查验了玩家 ${target}，身份是 ${targetPlayer.role}。`);
                            } else { console.info(`[AI DEBUG] AI 预言家 (玩家 ${seerAI.id}) 未查验或目标无效。`);}
                        }
                        addLog('预言家行动结束。女巫请行动。', 'system', true);
                        setGamePhase(GAME_PHASES.WITCH_ACTS_SAVE);
                    }
                    break;
                case GAME_PHASES.WITCH_ACTS_SAVE:
                    console.debug("[EXECUTE_CURRENT_STEP] In WITCH_ACTS_SAVE phase.");
                    if (currentHumanPlayer_local?.role === ROLES.WITCH && currentHumanPlayer_local.isAlive) {
                        const wolfVictimPlayer = currentPlayers_local.find(p => p.id === werewolfTargetId);
                        if (witchPotions.antidote && wolfVictimPlayer && wolfVictimPlayer.isAlive) {
                             // UI action will handle this
                        } else { 
                            addLog('女巫请决定是否使用毒药（无解药目标或无解药）。', 'system', true);
                            setGamePhase(GAME_PHASES.WITCH_ACTS_POISON);
                        }
                    } else { 
                        const witchAI = currentPlayers_local.find(p => p.role === ROLES.WITCH && p.isAlive && !p.isHuman);
                        if (witchAI) {
                            const wolfVictimPlayer = currentPlayers_local.find(p => p.id === werewolfTargetId);
                            if (witchPotions.antidote && wolfVictimPlayer && wolfVictimPlayer.isAlive) {
                                const choice = await getAIDecision(witchAI, 'WITCH_SAVE_CHOICE', currentLog_local);
                                if (choice === 'yes') {
                                    setPlayers(prev => prev.map(p => p.id === werewolfTargetId ? { ...p, isHealedByWitch: true } : p));
                                    setWitchPotions(prev => ({ ...prev, antidote: false }));
                                    console.info(`[AI DEBUG] AI 女巫 (玩家 ${witchAI.id}) 对玩家 ${werewolfTargetId} 使用了解药。`);
                                } else { console.info(`[AI DEBUG] AI 女巫 (玩家 ${witchAI.id}) 选择不使用解药。`); }
                            } else { console.info(`[AI DEBUG] AI 女巫 (玩家 ${witchAI.id}) 在救人环节无行动。`);}
                        }
                        addLog('女巫请决定是否使用毒药。', 'system', true);
                        setGamePhase(GAME_PHASES.WITCH_ACTS_POISON);
                    }
                    break;
                case GAME_PHASES.WITCH_ACTS_POISON:
                    console.debug("[EXECUTE_CURRENT_STEP] In WITCH_ACTS_POISON phase.");
                     if (currentHumanPlayer_local?.role === ROLES.WITCH && currentHumanPlayer_local.isAlive) {
                        // Waiting for human action
                    } else { 
                        const witchAI = currentPlayers_local.find(p => p.role === ROLES.WITCH && p.isAlive && !p.isHuman);
                        if (witchAI) {
                            if (witchPotions.poison) {
                                const choiceStr = await getAIDecision(witchAI, 'WITCH_POISON_CHOICE', currentLog_local);
                                if (choiceStr !== 'no' && choiceStr !== null && !isNaN(parseInt(choiceStr))) {
                                    const targetToPoison = parseInt(choiceStr, 10);
                                    if (players.find(p => p.id === targetToPoison)?.isAlive && targetToPoison !== witchAI.id) {
                                        setPlayerToPoisonId(targetToPoison);
                                        setWitchPotions(prev => ({ ...prev, poison: false }));
                                        console.info(`[AI DEBUG] AI 女巫 (玩家 ${witchAI.id}) 对玩家 ${targetToPoison} 使用了毒药。`);
                                    } else { console.info(`[AI DEBUG] AI 女巫 (玩家 ${witchAI.id}) 提供的毒杀目标 ${choiceStr} 无效。`); setPlayerToPoisonId(null); }
                                } else { console.info(`[AI DEBUG] AI 女巫 (玩家 ${witchAI.id}) 选择不使用毒药。`); setPlayerToPoisonId(null); }
                            } else { console.info(`[AI DEBUG] AI 女巫 (玩家 ${witchAI.id}) 已无毒药。`); setPlayerToPoisonId(null); }
                        }
                        addLog('女巫行动结束。夜晚结束，天亮了！', 'system', true);
                        setGamePhase(GAME_PHASES.NIGHT_RESOLUTION);
                    }
                    break;
                case GAME_PHASES.NIGHT_RESOLUTION:
                    console.debug("[EXECUTE_CURRENT_STEP] In NIGHT_RESOLUTION phase.");
                    resolveNightActions(); 
                    break;
                case GAME_PHASES.DAY_START:
                    console.debug("[EXECUTE_CURRENT_STEP] In DAY_START phase.");
                    let dayStartMessage = "天亮了。";
                    if (pendingDeathPlayerIds.length > 0) {
                        pendingDeathPlayerIds.forEach(deadId => {
                            const deadPlayer = currentPlayers_local.find(p => p.id === deadId);
                            if (deadPlayer) dayStartMessage += ` 玩家 ${deadId} (${deadPlayer.role}) 在昨晚死亡。`;
                        });
                    }
                    const hunterDied = currentPlayers_local.find(p => pendingDeathPlayerIds.includes(p.id) && !p.isAlive && p.role === ROLES.HUNTER);
                    if (hunterDied) {
                        dayStartMessage += ` 猎人玩家 ${hunterDied.id} 已死亡，请选择是否开枪。`;
                        setHunterTargetId(null);
                        addLog(dayStartMessage, 'system', true);
                        setGamePhase(GAME_PHASES.HUNTER_MAY_ACT);
                    } else {
                        const firstAlive = currentPlayers_local.find(p => p.isAlive);
                        setCurrentPlayerSpeakingId(firstAlive ? firstAlive.id : 0);
                        dayStartMessage += ' 进入讨论阶段。';
                        if (firstAlive) dayStartMessage += ` 首先请玩家 ${firstAlive.id} 发言。`;
                        addLog(dayStartMessage, 'system', true);
                        setGamePhase(GAME_PHASES.DISCUSSION);
                    }
                    setPendingDeathPlayerIds([]);
                    break;
                case GAME_PHASES.HUNTER_MAY_ACT:
                    console.debug("[EXECUTE_CURRENT_STEP] In HUNTER_MAY_ACT phase.");
                    const humanHunterIsDead = currentHumanPlayer_local?.role === ROLES.HUNTER && !currentHumanPlayer_local.isAlive && (pendingDeathPlayerIds.includes(currentHumanPlayer_local.id) || hunterTargetId === currentHumanPlayer_local.id);
                    if (humanHunterIsDead) {
                        addLog('等待你（猎人）决定是否开枪...', 'system', true);
                    } else { 
                        const deadAIHunter = currentPlayers_local.find(p => !p.isHuman && p.role === ROLES.HUNTER && !p.isAlive && (pendingDeathPlayerIds.includes(p.id) || hunterTargetId === p.id));
                        if (deadAIHunter) {
                            const targetStr = await getAIDecision(deadAIHunter, 'HUNTER_SHOOT', currentLog_local);
                            const target = parseInt(targetStr, 10);
                            const targetPlayer = currentPlayers_local.find(p => p.id === target);
                            if (targetStr !== 'no' && !isNaN(target) && targetPlayer?.isAlive && targetPlayer.id !== deadAIHunter.id) {
                                let updatedHunterKillPlayers = currentPlayers_local.map(p => p.id === target ? { ...p, isAlive: false, revealedRole: p.role } : p);
                                setPlayers(updatedHunterKillPlayers); 
                                addLog(`猎人 (玩家 ${deadAIHunter.id}) 开枪带走了玩家 ${target} (${targetPlayer.role})！`, 'system', true);
                                setHunterTargetId(target);
                                if (!checkWinCondition(updatedHunterKillPlayers)) { isProcessingStepRef.current = false; return; }
                            } else {
                                addLog(`猎人 (玩家 ${deadAIHunter.id}) 选择不开枪或目标无效。`, 'system', true);
                            }
                        }
                        addLog('猎人行动结束。进入讨论阶段。', 'system', true);
                        const firstAliveDisc = currentPlayers_local.find(p => p.isAlive);
                        setCurrentPlayerSpeakingId(firstAliveDisc ? firstAliveDisc.id : 0);
                        setGamePhase(GAME_PHASES.DISCUSSION);
                    }
                    break;
                case GAME_PHASES.DISCUSSION:
                    console.debug(`[EXECUTE_CURRENT_STEP] In DISCUSSION phase. Current speaker ID: ${currentPlayerSpeakingId}`);
                    const speaker = currentPlayers_local.find(p => p.id === currentPlayerSpeakingId);
                    if (speaker && speaker.isAlive) {
                        if (speaker.isHuman) {
                            // addLog(`轮到你 (玩家 ${speaker.id}) 发言。`, 'system', true); // Logged by handleNextSpeaker or initial phase set
                        } else { 
                            console.debug(`[EXECUTE_CURRENT_STEP] AI Player ${speaker.id} turn to speak in DISCUSSION.`);
                            const statement = await getAIDecision(speaker, 'DISCUSSION_STATEMENT', currentLog_local);
                            if (gamePhase === GAME_PHASES.DISCUSSION && currentPlayerSpeakingId === speaker.id && !winner) { 
                                addLog(`玩家 ${speaker.id} 说: ${statement || "选择跳过发言。"}`, 'ai', true);
                                handleNextSpeaker(); 
                            } else {
                                 console.warn(`[AI_DISCUSSION_STALE_IN_EXECUTE] AI Player ID: ${speaker.id}. Phase/speaker changed.`);
                            }
                        }
                    } else if (currentPlayers_local.filter(p => p.isAlive).length > 0) { 
                        console.warn(`[EXECUTE_CURRENT_STEP] DISCUSSION: Current speaker ${currentPlayerSpeakingId} is invalid or dead. Moving to next.`);
                        handleNextSpeaker();
                    } else if (!winner) { 
                        console.debug("[EXECUTE_CURRENT_STEP] DISCUSSION: No one left to speak, moving to VOTING.");
                        addLog('所有存活玩家发言完毕，进入投票阶段。', 'system', true);
                        setGamePhase(GAME_PHASES.VOTING);
                    }
                    break;
                case GAME_PHASES.VOTING:
                    console.debug("[EXECUTE_CURRENT_STEP] In VOTING phase.");
                    const humanCanVote = currentHumanPlayer_local?.isAlive && !currentVotes[currentHumanPlayer_local.id];
                    const all_alive_voting = currentPlayers_local.filter(p => p.isAlive);
                    const all_voted_voting = all_alive_voting.every(p => currentVotes.hasOwnProperty(p.id));

                    if (humanCanVote) {
                        addLog("等待你投票...", "system", true);
                    } else if (!all_voted_voting) {
                        console.debug("[EXECUTE_CURRENT_STEP] VOTING: Human voted or not applicable, but not all votes in. Triggering AI voting.");
                        await handleAIVoting(); // Make sure this is awaited
                    } else if (all_voted_voting && currentPhase_local === GAME_PHASES.VOTING) { 
                        console.debug("[EXECUTE_CURRENT_STEP] VOTING: All votes are in. Setting phase to VOTE_RESULTS.");
                        addLog('投票结束。正在统计结果。', 'system', true);
                        setGamePhase(GAME_PHASES.VOTE_RESULTS);
                    }
                    break;
                case GAME_PHASES.VOTE_RESULTS:
                    console.debug("[EXECUTE_CURRENT_STEP] In VOTE_RESULTS phase.");
                    resolveVoting();
                    break;
                case GAME_PHASES.GAME_OVER:
                    console.debug("[EXECUTE_CURRENT_STEP] In GAME_OVER phase.");
                    break;
                default:
                    console.error(`[EXECUTE_CURRENT_STEP] Unknown game phase: ${gamePhase}`);
            }
        } catch (error) {
            console.error("[EXECUTE_CURRENT_STEP] Error in step execution:", error);
            addLog("游戏步骤执行出错，请检查控制台。", "error", true);
        } finally {
            console.debug(`[EXECUTE_CURRENT_STEP] FINALLY. Releasing lock. Phase was: ${currentPhase_local}. New isProcessingStepRef.current: false`);
            isProcessingStepRef.current = false;
        }
    };
    
    if (players.length > 0 || gamePhase === GAME_PHASES.SETUP || gamePhase === GAME_PHASES.SHOW_ROLE_MODAL) {
        executeCurrentStep();
    }

  }, [
    gamePhase, 
    winner, 
    players.length, // Keep players.length for initial setup trigger
    showRoleModalState,
    // The following are functions that executeCurrentStep might call.
    // They are memoized with useCallback, so their references are stable unless their own deps change.
    initializeGame, 
    resolveNightActions, 
    resolveVoting, 
    getAIDecision, 
    handleNextSpeaker, 
    checkWinCondition, 
    addLog,
    // The following are state values that are read *inside* executeCurrentStep or the functions it calls.
    // Their inclusion here is to ensure executeCurrentStep re-runs if they change *and* gamePhase hasn't changed yet
    // to a new phase that would naturally re-evaluate. However, this list can become very long and prone to causing loops.
    // A more robust solution might involve more explicit state passing or a more refined state machine.
    // For now, keeping a minimal set related to direct conditional logic in executeCurrentStep.
    players, // Added 'players' back as its content is critical for many decisions
    werewolfTargetId, 
    witchPotions, // witchPotions is an object, its reference changes if antidote/poison changes
    guardLastProtectedId, 
    pendingDeathPlayerIds, 
    currentPlayerSpeakingId, 
    currentVotes, 
    humanPlayerId, 
    seerLastCheck, 
    playerToPoisonId, 
    hunterTargetId
  ]);


  const toggleListen = () => {
    if (!recognitionRef.current) {
        addLog('语音识别功能尚未准备好。', 'error', true);
        return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setHumanPlayerSpeech(''); 
      try {
        recognitionRef.current.start();
        setIsListening(true);
        addLog('请开始发言...', 'system', true);
      } catch (e) {
        console.error("Error starting speech recognition: ", e);
        addLog(`启动语音识别失败: ${e.message}. 请检查麦克风设置。`, 'error', true);
        setIsListening(false);
      }
    }
  };

  // Add new function to handle speech submission
  const handleSpeechSubmission = useCallback(() => {
    if (humanPlayerSpeech.trim()) {
      addLog(`你 (玩家 ${humanPlayerId}) 说: ${humanPlayerSpeech}`, 'human', true);
    } else {
      addLog(`你 (玩家 ${humanPlayerId}) 选择跳过发言。`, 'human', true);
    }
    setHumanPlayerSpeech(''); // Clear the speech input
    handleNextSpeaker();
  }, [humanPlayerSpeech, humanPlayerId, addLog, handleNextSpeaker]);

  // --- UI Rendering ---
  const humanPlayer = players.find(p => p.isHuman);

  const renderPlayerCard = (player) => {
    let cardBg = 'bg-slate-700'; 
    let textColor = 'text-slate-100';
    let borderColor = 'border-slate-600'; 
    let wolfTeammateIcon = '';

    if (!player.isAlive) {
        cardBg = 'bg-neutral-800'; 
        textColor = 'text-neutral-400'; 
        borderColor = 'border-neutral-700';
    } else if (player.isHuman) {
        cardBg = 'bg-sky-600'; 
        textColor = 'text-white'; 
        borderColor = 'border-sky-400';
    } else { 
        cardBg = 'bg-slate-600'; 
        textColor = 'text-slate-50'; 
        borderColor = 'border-slate-500';
    }


    if (humanPlayer?.role === ROLES.WEREWOLF && player.role === ROLES.WEREWOLF && player.id !== humanPlayer.id && player.isAlive) {
        wolfTeammateIcon = '🐺'; 
    }


    return (
        <div key={player.id} className={`p-4 border rounded-lg shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 
        ${cardBg} ${borderColor}
        ${gamePhase === GAME_PHASES.DISCUSSION && currentPlayerSpeakingId === player.id && player.isAlive ? 'ring-4 ring-yellow-400 ring-opacity-75' : ''}
        ${werewolfTargetId === player.id && gamePhase === GAME_PHASES.WEREWOLVES_ACT ? 'ring-4 ring-red-500' : ''}
        ${(seerLastCheck?.targetId === player.id && gamePhase === GAME_PHASES.SEER_ACTS && humanPlayer?.role === ROLES.SEER) ? 'ring-4 ring-blue-500' : ''}
        ${player.isProtected && player.isAlive ? 'border-l-4 border-green-400' : ''} 
        `}>
        <p className={`font-bold text-xl mb-1 ${textColor}`}>{player.name} {wolfTeammateIcon} {player.isProtected && player.isAlive && player.role !== ROLES.GUARD ? '🛡️' : ''}</p>
        {player.isAlive ? <p className={`text-sm ${player.isHuman ? 'text-green-300' : 'text-green-400'}`}>状态: 存活</p> : <p className="text-sm text-red-400">状态: 已淘汰 ({player.revealedRole || '未知身份'})</p>}
        
        {gamePhase === GAME_PHASES.VOTING && player.isAlive && (
            <p className={`text-xs ${textColor}`}>被投票数: {Object.values(currentVotes).filter(v => v === player.id).length}</p>
        )}
        {humanPlayer?.isAlive && (
            <>
            {(gamePhase === GAME_PHASES.WEREWOLVES_ACT && humanPlayer.role === ROLES.WEREWOLF && player.isAlive && player.id !== humanPlayer.id ) && (
                <button onClick={() => handlePlayerAction('WEREWOLF_TARGET', player.id)} className="mt-2 w-full px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm shadow-sm">攻击</button>
            )}
            {(gamePhase === GAME_PHASES.GUARD_ACTS && humanPlayer.role === ROLES.GUARD && player.isAlive && player.id !== guardLastProtectedId) && (
                <button onClick={() => handlePlayerAction('GUARD_PROTECT', player.id)} className="mt-2 w-full px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm shadow-sm">守护</button>
            )}
            {(gamePhase === GAME_PHASES.SEER_ACTS && humanPlayer.role === ROLES.SEER && player.isAlive && player.id !== humanPlayer.id) && (
                <button onClick={() => handlePlayerAction('SEER_CHECK', player.id)} className="mt-2 w-full px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm shadow-sm">查验</button>
            )}
            {(gamePhase === GAME_PHASES.WITCH_ACTS_POISON && humanPlayer.role === ROLES.WITCH && witchPotions.poison && player.isAlive && player.id !== humanPlayer.id) && (
                <button onClick={() => handlePlayerAction('USE_POISON', player.id)} className="mt-2 w-full px-2 py-1 bg-purple-700 text-white rounded hover:bg-purple-800 text-sm shadow-sm">毒杀</button>
            )}
            {(gamePhase === GAME_PHASES.VOTING && player.isAlive && player.id !== humanPlayer.id && !currentVotes[humanPlayer.id]) && (
                <button onClick={() => handlePlayerAction('VOTE_PLAYER', player.id)} className="mt-2 w-full px-2 py-1 bg-yellow-500 text-black rounded hover:bg-yellow-600 text-sm shadow-sm">投票</button>
            )}
            </>
        )}
        {(gamePhase === GAME_PHASES.HUNTER_MAY_ACT && humanPlayer?.role === ROLES.HUNTER && !humanPlayer.isAlive && player.isAlive && player.id !== humanPlayer.id) && 
        (pendingDeathPlayerIds.includes(humanPlayer.id) || (hunterTargetId !== null && humanPlayer.id === players.find(p => p.id === hunterTargetId && p.role === ROLES.HUNTER && !p.isAlive)?.id) ) && ( 
            <button onClick={() => handlePlayerAction('HUNTER_SHOOT', player.id)} className="mt-2 w-full px-2 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 text-sm shadow-sm">射杀</button>
        )}
        </div>
    );
    }

  if (players.length === 0 && gamePhase === GAME_PHASES.SETUP) {
    return (
      <div className="min-h-screen bg-gray-800 text-white flex flex-col items-center justify-center p-4">
        <h1 className="text-5xl font-bold mb-8 tracking-wider">狼 人 杀</h1>
        <button 
            onClick={() => { initializeGame();}} 
            className="px-8 py-4 bg-purple-600 text-white text-2xl rounded-lg shadow-xl hover:bg-purple-700 transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-400 focus:ring-opacity-50"
        >
            开始游戏
        </button>
      </div>
    );
  }
  
  if (winner) {
    const winnerMessage = winner === 'WEREWOLVES' ? '🐺 狼人阵营胜利！🐺' : (winner === 'VILLAGERS' ? '🧑‍🌾 平民阵营胜利！🧑‍🌾' : '游戏结束！');
    const winnerColor = winner === 'WEREWOLVES' ? 'bg-red-700' : (winner === 'VILLAGERS' ? 'bg-green-600' : 'bg-gray-700');
    return (
      <div className={`min-h-screen ${winnerColor} text-white flex flex-col items-center justify-center p-4`}>
        <h1 className="text-6xl font-bold mb-6 animate-pulse">{winnerMessage}</h1>
        <div className="bg-black bg-opacity-30 p-6 rounded-lg shadow-2xl mb-8 w-full max-w-md text-center">
          <h3 className="text-2xl font-semibold mb-3 border-b pb-2">最终身份:</h3>
          {players.map(p => <p key={p.id} className="text-lg">{p.name}: <span className="font-semibold">{p.role}</span></p>)}
        </div>
        <button 
            onClick={() => { setGamePhase(GAME_PHASES.SETUP); setPlayers([]); setWinner(null);}}
            className="px-8 py-4 bg-yellow-500 text-black text-2xl rounded-lg shadow-xl hover:bg-yellow-600 transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-yellow-300 focus:ring-opacity-50"
        >
            重新开始
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 flex flex-col md:flex-row gap-6 font-sans">
      {gamePhase === GAME_PHASES.SHOW_ROLE_MODAL && humanPlayer && ( 
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 p-8 rounded-xl shadow-2xl text-center border border-purple-500 max-w-lg w-full">
            <h2 className="text-3xl font-bold mb-3 text-purple-400">你的身份是</h2>
            <p className="text-4xl mb-6 font-mono tracking-widest">{humanPlayer.role}</p>
            <div className="mb-6 text-left text-gray-300 space-y-2 text-md">
              {humanPlayer.role === ROLES.WEREWOLF && <p>🐺 你的目标是消灭所有神民阵营的玩家。夜晚与同伴一起杀人。白天隐藏身份，误导好人。</p>}
              {humanPlayer.role === ROLES.SEER && <p>👁️ 你的目标是找出狼人。每晚可以查验一人身份。谨慎地传递信息。</p>}
              {humanPlayer.role === ROLES.WITCH && <p>🧪 你有一瓶解药和一瓶毒药，各只能用一次。解药救被杀者，毒药杀一人。</p>}
              {humanPlayer.role === ROLES.GUARD && <p>🛡️ 每晚可以守护一人免受狼杀，不能连续两晚守护同一个人。</p>}
              {humanPlayer.role === ROLES.HUNTER && <p>🎯 当你死亡时（被狼杀或投票出局），你可以选择一名玩家与你一同出局。</p>}
              {humanPlayer.role === ROLES.VILLAGER && <p>🧑‍🌾 你的目标是找出并投票淘汰所有狼人。仔细分析，找出真相。</p>}
            </div>
            <button 
                onClick={() => { 
                    setShowRoleModalState(false); 
                    addLog(`你的身份是: ${humanPlayer.role}`, 'system', true); 
                    setGamePhase(GAME_PHASES.NIGHT_START);
                }} 
                className="px-6 py-3 bg-purple-600 text-white text-lg rounded-lg shadow-md hover:bg-purple-700 transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
                知道了，进入游戏
            </button>
          </div>
        </div>
      )}

      <div className="md:w-1/3 space-y-6">
        <div className="bg-gray-800 p-5 rounded-xl shadow-lg border border-gray-700">
          <h2 className="text-3xl font-bold mb-3 text-purple-400 border-b border-gray-700 pb-2">狼人杀 ({PLAYER_COUNT}人局)</h2>
          <p className="text-xl">阶段: <span className="font-semibold text-yellow-400">{gamePhase}</span></p>
          {humanPlayer && <p className="text-lg">身份: <span className="font-semibold">{humanPlayer.role}</span> {humanPlayer.isAlive ? <span className="text-green-400">(存活)</span> : <span className="text-red-400">(已淘汰)</span>}</p>}
          {humanPlayer?.role === ROLES.WITCH && (
            <p className="text-sm mt-1">药剂: 
              <span className={witchPotions.antidote ? 'text-green-400' : 'text-red-400'}>{witchPotions.antidote ? '解药可用 ✅' : '解药已用 ❌'}</span> | 
              <span className={witchPotions.poison ? 'text-green-400' : 'text-red-400'}>{witchPotions.poison ? '毒药可用 ✅' : '毒药已用 ❌'}</span>
            </p>
          )}
          {seerLastCheck && humanPlayer?.role === ROLES.SEER && ( 
            <p className="text-sm mt-1 text-blue-400">上次查验: 玩家 {seerLastCheck.targetId} 是 <span className="font-bold">{seerLastCheck.targetRole}</span></p>
          )}
        </div>

        <div className="bg-gray-800 p-5 rounded-xl shadow-lg border border-gray-700 space-y-3">
          <h3 className="text-2xl font-semibold text-purple-400 border-b border-gray-700 pb-2">你的行动</h3>
          
          {gamePhase === GAME_PHASES.WITCH_ACTS_SAVE && humanPlayer?.role === ROLES.WITCH && humanPlayer.isAlive && players.find(p=>p.id === werewolfTargetId)?.isAlive && ( 
            <div className="space-y-2">
              <p className="text-center">狼人攻击了玩家 {werewolfTargetId}。是否使用解药?</p>
              <button onClick={() => handlePlayerAction('USE_ANTIDOTE')} disabled={!witchPotions.antidote} className={`w-full px-4 py-2 rounded shadow-sm ${witchPotions.antidote ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-500 opacity-50 cursor-not-allowed'} text-white`}>
                {witchPotions.antidote ? '使用解药' : '解药已用'}
              </button>
              <button onClick={() => handlePlayerAction('SKIP_ANTIDOTE')} className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 shadow-sm">不使用</button>
            </div>
          )}
          {gamePhase === GAME_PHASES.WITCH_ACTS_POISON && humanPlayer?.role === ROLES.WITCH && humanPlayer.isAlive && (
            <button onClick={() => handlePlayerAction('SKIP_POISON')} disabled={!witchPotions.poison} className={`w-full px-4 py-2 rounded shadow-sm ${witchPotions.poison ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-500 cursor-not-allowed opacity-50'} text-white`}>
              {witchPotions.poison ? '不使用毒药并结束回合' : '已无毒药'}
            </button>
          )}
           {gamePhase === GAME_PHASES.HUNTER_MAY_ACT && humanPlayer?.role === ROLES.HUNTER && !humanPlayer.isAlive && 
            (pendingDeathPlayerIds.includes(humanPlayer.id) || (hunterTargetId !== null && humanPlayer.id === players.find(p => p.id === hunterTargetId && p.role === ROLES.HUNTER && !p.isAlive)?.id)) && (
            <button onClick={() => handlePlayerAction('HUNTER_SKIP_SHOOT')} className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 shadow-sm">选择不开枪</button>
          )}

          {gamePhase === GAME_PHASES.DISCUSSION && humanPlayer?.isAlive && players.find(p=>p.id === currentPlayerSpeakingId)?.id === humanPlayer.id && (
            <div className="space-y-3">
              <p className="font-semibold text-lg text-yellow-400">轮到你发言了:</p>
              <textarea value={humanPlayerSpeech} onChange={(e) => setHumanPlayerSpeech(e.target.value)} rows="4" className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-50" placeholder="输入你的发言..."></textarea>
              <button onClick={toggleListen} className={`w-full px-4 py-2 rounded shadow-md transition-colors ${isListening ? 'bg-red-600 hover:bg-red-700' : 'bg-teal-500 hover:bg-teal-600'} text-white`}>
                {isListening ? '停止录音 🎤' : '开始录音 🎤'}
              </button>
              <button onClick={handleSpeechSubmission} className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 shadow-md">确认发言 / 跳过</button>
            </div>
          )}
          {gamePhase === GAME_PHASES.DISCUSSION && humanPlayer?.isAlive && players.find(p=>p.id === currentPlayerSpeakingId)?.id !== humanPlayer.id && (
            <button onClick={handleNextSpeaker} className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 shadow-sm">跳过AI发言 (调试)</button>
          )}
          {gamePhase === GAME_PHASES.VOTING && humanPlayer?.isAlive && !currentVotes[humanPlayer.id] && (
             <p className="text-center font-semibold text-yellow-400">请在右侧玩家列表中选择投票目标。</p>
          )}
          {gamePhase === GAME_PHASES.VOTING && Object.keys(currentVotes).length > 0 && Object.keys(currentVotes).length < players.filter(p=>p.isAlive).length && (
             <p className="text-center animate-pulse text-gray-400">等待其他玩家投票...</p>
          )}
           {gamePhase === GAME_PHASES.VOTING && players.filter(p=>p.isAlive).length > 0 && Object.keys(currentVotes).length === players.filter(p=>p.isAlive).length && (
             <button onClick={() => setGamePhase(GAME_PHASES.VOTE_RESULTS)} className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-lg text-lg font-semibold">查看投票结果</button>
          )}
        </div>

        <div className="bg-gray-800 p-5 rounded-xl shadow-lg border border-gray-700 h-96 overflow-y-auto">
          <h3 className="text-2xl font-semibold mb-3 text-purple-400 border-b border-gray-700 pb-2">游戏记录</h3>
          <div className="space-y-2">
            {gameLog.slice().reverse().map((log, index) => (
              <p key={index} className={`text-sm leading-relaxed ${log.type === 'human' ? 'text-blue-300' : (log.type === 'ai' ? 'text-teal-300' : (log.type === 'error' ? 'text-red-400 font-semibold' : 'text-gray-300'))}`}>
                <span className="text-xs text-gray-500 mr-1">[{log.timestamp}]</span>{log.text}
              </p>
            ))}
          </div>
        </div>
      </div>

      <div className="md:w-2/3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {players.map(renderPlayerCard)}
        </div>
      </div>
    </div>
  );
};

export default App;
