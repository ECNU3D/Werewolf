import { useState, useEffect, useCallback, useRef } from 'react';
import { ROLES, GAME_PHASES } from '../constants/gameConstants';
import { initializePlayers, checkWinCondition } from '../utils/gameUtils';
import { getAIDecision } from '../utils/aiUtils';

export const useGameLogic = () => {
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

  const isProcessingStepRef = useRef(false); 

  // 2. useCallback-wrapped functions & other functions

  const addLog = useCallback((message, type = 'system', uiVisible = true) => {
    console.log(`[LOG][${type}] ${message}`); 
    if (uiVisible) {
        setGameLog(prevLog => [...prevLog, { text: message, type, timestamp: new Date().toLocaleTimeString() }]);
    }
  }, []);

  const getAIDecisionWrapper = useCallback(async (aiPlayer, promptPurpose, currentHistory_param) => {
    const gameState = {
      players,
      seerLastCheck,
      guardLastProtectedId,
      werewolfTargetId,
      witchPotions,
      humanPlayerId,
      addLog
    };
    return await getAIDecision(aiPlayer, promptPurpose, currentHistory_param, gameState);
  }, [players, seerLastCheck, guardLastProtectedId, werewolfTargetId, witchPotions, humanPlayerId, addLog]);

  const checkWinConditionWrapper = useCallback((currentPlayersToCheck) => {
    const result = checkWinCondition(currentPlayersToCheck);
    if (result.gameOver && !winner) {
      if (result.winner === 'DRAW') {
        addLog('所有玩家都已死亡！游戏平局或出现错误！', 'system', true);
      } else if (result.winner === 'VILLAGERS') {
        addLog('所有狼人已被消灭！平民阵营胜利！', 'system', true);
      } else if (result.winner === 'WEREWOLVES') {
        addLog('狼人数量达到或超过好人数量！狼人阵营胜利！', 'system', true);
      }
      setWinner(result.winner);
      setGamePhase(GAME_PHASES.GAME_OVER);
      return false;
    }
    return true;
  }, [addLog, winner]);

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
    
    const gameStillOn = checkWinConditionWrapper(updatedPlayers);
    if (gameStillOn) {
      setGamePhase(GAME_PHASES.DAY_START);
    }
    console.debug("[RESOLVE_NIGHT_ACTIONS] Finished night resolution.");
  }, [players, werewolfTargetId, playerToPoisonId, addLog, checkWinConditionWrapper]);

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
    const gameStillOn = checkWinConditionWrapper(updatedPlayers);

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
  }, [players, currentVotes, addLog, checkWinConditionWrapper]);
  
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
  }, [currentPlayerSpeakingId, players, winner, addLog]);

  const initializeGameWrapper = useCallback((gameConfig = { isRandomRole: true, selectedRole: null }) => {
    console.log('[GAME_INIT] Received config:', gameConfig);
    addLog('游戏初始化...', 'system', true);
    const { newPlayers, humanId } = initializePlayers(gameConfig);
    setHumanPlayerId(humanId);
    setPlayers(newPlayers);
    
    // Log role assignment info
    const humanPlayer = newPlayers.find(p => p.isHuman);
    console.log('[GAME_INIT] Human player assigned role:', humanPlayer.role);
    if (gameConfig.isRandomRole) {
      addLog('游戏开始！身份已随机分配。', 'system', true);
    } else {
      addLog(`游戏开始！你选择扮演 ${humanPlayer.role}。`, 'system', true);
    }
    
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
  }, [addLog]);

  const handleAIVoting = async () => {
    console.debug("[HANDLE_AI_VOTING] Starting AI voting process.");
    const aliveAIPlayers = players.filter(p => p.isAlive && !p.isHuman);
    let newVotesCollectedThisTurn = {}; // Collect new votes here
    let anyNewVotes = false;

    for (const aiPlayer of aliveAIPlayers) {
        // Only process AI if they haven't voted yet
        if (!currentVotes.hasOwnProperty(aiPlayer.id)) {
            const aiVoteTargetIdStr = await getAIDecisionWrapper(aiPlayer, 'VOTE_PLAYER', gameLog);
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

  return {
    // State
    players,
    humanPlayerId,
    gamePhase,
    gameLog,
    showRoleModalState,
    witchPotions,
    guardLastProtectedId,
    seerLastCheck,
    werewolfTargetId,
    playerToPoisonId,
    hunterTargetId,
    pendingDeathPlayerIds,
    currentPlayerSpeakingId,
    currentVotes,
    winner,
    isProcessingStepRef,
    
    // Setters
    setPlayers,
    setGamePhase,
    setShowRoleModalState,
    setWitchPotions,
    setGuardLastProtectedId,
    setSeerLastCheck,
    setWerewolfTargetId,
    setPlayerToPoisonId,
    setHunterTargetId,
    setPendingDeathPlayerIds,
    setCurrentPlayerSpeakingId,
    setCurrentVotes,
    setWinner,
    
    // Functions
    addLog,
    getAIDecisionWrapper,
    checkWinConditionWrapper,
    resolveNightActions,
    resolveVoting,
    handleNextSpeaker,
    initializeGame: initializeGameWrapper,
    handleAIVoting
  };
}; 