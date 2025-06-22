import { useState, useEffect, useCallback, useRef } from 'react';
import { ROLES, GAME_PHASES } from '../constants/gameConstants';
import { initializePlayers, checkWinCondition } from '../utils/gameUtils';
import { getAIDecision } from '../utils/aiUtils';
import { useLanguage } from '../contexts/LanguageContext';
import { logManager, LOG_CATEGORIES, LOG_VISIBILITY } from '../utils/logManager';

export const useGameLogic = () => {
  const { t, tr, currentLanguage } = useLanguage();
  
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

  // Updated addLog to use the new log manager
  const addLog = useCallback((message, type = 'system', category = LOG_CATEGORIES.GAME_FLOW, visibility = LOG_VISIBILITY.PUBLIC, visibleToRoles = [], visibleToPlayers = []) => {
    logManager.addLog({
      message,
      type,
      category,
      visibility,
      visibleToRoles,
      visibleToPlayers
    });
    
    // Update the gameLog state for UI display - but only for the human player
    const humanPlayer = players.find(p => p.isHuman);
    if (humanPlayer) {
      const logsForHuman = logManager.getUILogsForPlayer(humanPlayer.id, humanPlayer.role, humanPlayer.id);
      setGameLog(logsForHuman);
    }
  }, [players]);

  // Helper methods for different log types
  const addPublicLog = useCallback((message, type = 'system', category = LOG_CATEGORIES.GAME_FLOW) => {
    addLog(message, type, category, LOG_VISIBILITY.PUBLIC);
  }, [addLog]);

  const addPrivateLog = useCallback((message, visibleToRoles = [], visibleToPlayers = [], type = 'system', category = LOG_CATEGORIES.ROLE_INFO) => {
    addLog(message, type, category, LOG_VISIBILITY.PRIVATE, visibleToRoles, visibleToPlayers);
  }, [addLog]);

  const addNightActionLog = useCallback((actionType, details, playerRole) => {
    logManager.addNightActionLog(actionType, details, playerRole);
    // Update UI logs
    const humanPlayer = players.find(p => p.isHuman);
    if (humanPlayer) {
      const logsForHuman = logManager.getUILogsForPlayer(humanPlayer.id, humanPlayer.role, humanPlayer.id);
      setGameLog(logsForHuman);
    }
  }, [players]);

  const getAIDecisionWrapper = useCallback(async (aiPlayer, promptPurpose) => {
    // Get role-specific logs for AI decision making - this includes ALL historical information
    const aiLogs = logManager.getAILogsForRole(aiPlayer.role);
    
    const gameState = {
      players,
      seerLastCheck,
      guardLastProtectedId,
      werewolfTargetId,
      witchPotions,
      humanPlayerId,
      addLog: addPublicLog // Use public log for AI errors
    };
    return await getAIDecision(aiPlayer, promptPurpose, aiLogs, gameState, currentLanguage);
  }, [players, seerLastCheck, guardLastProtectedId, werewolfTargetId, witchPotions, humanPlayerId, addPublicLog, currentLanguage]);

  const checkWinConditionWrapper = useCallback((currentPlayersToCheck) => {
    const result = checkWinCondition(currentPlayersToCheck);
    if (result.gameOver && !winner) {
      if (result.winner === 'DRAW') {
        addPublicLog(t('gameResults.allDead'), 'system', LOG_CATEGORIES.GAME_FLOW);
      } else if (result.winner === 'VILLAGERS') {
        addPublicLog(t('gameResults.villagersWin'), 'system', LOG_CATEGORIES.GAME_FLOW);
      } else if (result.winner === 'WEREWOLVES') {
        addPublicLog(t('gameResults.werewolvesWin'), 'system', LOG_CATEGORIES.GAME_FLOW);
      }
      setWinner(result.winner);
      setGamePhase(GAME_PHASES.GAME_OVER);
      return false;
    }
    return true;
  }, [addPublicLog, winner, t]);

  const resolveNightActions = useCallback(() => {
    console.debug("[RESOLVE_NIGHT_ACTIONS] Starting night resolution.");
    let deathsThisNightInfo = []; 
    let updatedPlayers = [...players]; 
    const wolfTargetPlayer = updatedPlayers.find(p => p.id === werewolfTargetId);

    // Handle werewolf attack
    if (wolfTargetPlayer && wolfTargetPlayer.isAlive) {
      if (wolfTargetPlayer.isProtected) {
        // Log protection success - this should be visible to guard privately
        addPrivateLog(
          t('nightActions.guardProtected', { playerId: wolfTargetPlayer.id }),
          [ROLES.GUARD],
          [],
          'system',
          LOG_CATEGORIES.NIGHT_ACTIONS
        );
        // Public log - vague message
        addPublicLog(t('nightActions.werewolfMissed'), 'system', LOG_CATEGORIES.NIGHT_ACTIONS);
      } else if (wolfTargetPlayer.isHealedByWitch) {
        // Log witch save - this should be visible to witch privately
        addPrivateLog(
          t('nightActions.witchSaved', { playerId: wolfTargetPlayer.id }),
          [ROLES.WITCH],
          [],
          'system',
          LOG_CATEGORIES.NIGHT_ACTIONS
        );
        // Public log - vague message
        addPublicLog(t('nightActions.werewolfMissed'), 'system', LOG_CATEGORIES.NIGHT_ACTIONS);
      } else {
        // Player actually dies - this is public info but without revealing the exact cause
        deathsThisNightInfo.push({ id: wolfTargetPlayer.id, role: wolfTargetPlayer.role, reason: t('nightActions.killedByWerewolf') });
      }
    } else if (werewolfTargetId !== null) {
       // Target was already dead or invalid
       addPublicLog(t('nightActions.werewolfMissed'), 'system', LOG_CATEGORIES.NIGHT_ACTIONS);
    } else {
       // Peaceful night - no werewolf target
       addPublicLog(t('nightActions.peacefulNight'), 'system', LOG_CATEGORIES.NIGHT_ACTIONS);
    }

    // Handle witch poison
    const poisonedPlayer = updatedPlayers.find(p => p.id === playerToPoisonId);
    if (poisonedPlayer && poisonedPlayer.isAlive) {
      const alreadyMarkedForDeathByWolf = deathsThisNightInfo.some(d => d.id === poisonedPlayer.id);
      if (!alreadyMarkedForDeathByWolf) {
         // Player dies from poison only
         deathsThisNightInfo.push({ id: poisonedPlayer.id, role: poisonedPlayer.role, reason: t('nightActions.poisonedByWitch') });
      } else {
         // Player was targeted by both wolf and witch - still dies once
         deathsThisNightInfo = deathsThisNightInfo.filter(d => d.id !== poisonedPlayer.id); 
         deathsThisNightInfo.push({ id: poisonedPlayer.id, role: poisonedPlayer.role, reason: t('nightActions.poisonedByWitch') });
      }
    }
    
    // Process actual deaths
    let actualDeadIdsThisNight = [];
    if (deathsThisNightInfo.length === 0) {
      if (werewolfTargetId === null && playerToPoisonId === null) { 
        addPublicLog(t('nightActions.noneDeadPeaceful'), 'system', LOG_CATEGORIES.NIGHT_ACTIONS);
      } else {
        addPublicLog(t('nightActions.noneDeadAfterActions'), 'system', LOG_CATEGORIES.NIGHT_ACTIONS);
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
        
        // Add a general death announcement without revealing specific causes
        const deathMessage = actualDeadIdsThisNight.length === 1 
          ? t('nightActions.werewolfKilled', { playerId: actualDeadIdsThisNight[0] })
          : `昨晚，${actualDeadIdsThisNight.map(id => `玩家 ${id}`).join('、')} 死亡了。`;
        
        logManager.addDeathAnnouncement(actualDeadIdsThisNight, deathMessage);
    }

    setPlayers(updatedPlayers);
    setPendingDeathPlayerIds(actualDeadIdsThisNight); 
    
    const gameStillOn = checkWinConditionWrapper(updatedPlayers);
    if (gameStillOn) {
      setGamePhase(GAME_PHASES.DAY_START);
    }
    console.debug("[RESOLVE_NIGHT_ACTIONS] Finished night resolution.");
  }, [players, werewolfTargetId, playerToPoisonId, addPublicLog, addPrivateLog, checkWinConditionWrapper, t]);

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
        voteMessage = t('voting.playerEliminated', { playerId: eliminatedPlayerId, role: tr(updatedPlayers[eliminatedPlayerIndex].role) });
      }
    } else if (playersWithMaxVotesIds.length > 1) {
      voteMessage = t('voting.tieVote');
    } else {
      voteMessage = t('voting.noElimination');
    }
    addPublicLog(voteMessage, 'system', LOG_CATEGORIES.VOTING);

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
  }, [players, currentVotes, addPublicLog, checkWinConditionWrapper, t, tr]);
  
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
      addPublicLog(t('gamePhases.discussionDone'), 'system', LOG_CATEGORIES.GAME_FLOW); 
      setGamePhase(GAME_PHASES.VOTING); 
      return;
    }
    
    console.debug(`[HANDLE_NEXT_SPEAKER_SETTING] Setting next speaker to Player ID: ${nextSpeakerToSetId}`);
    setCurrentPlayerSpeakingId(nextSpeakerToSetId); 

    const nextSpeakerDetails = players.find(p => p.id === nextSpeakerToSetId);
    if (nextSpeakerDetails) {
        addPublicLog(t('speaking.nextSpeaker', { playerId: nextSpeakerDetails.id }), 'system', LOG_CATEGORIES.ACTIONS);
    } else {
        console.error(`[HANDLE_NEXT_SPEAKER_ERROR] Could not find next speaker details for ID: ${nextSpeakerToSetId}`);
    }
  }, [currentPlayerSpeakingId, players, winner, addPublicLog, t]);

  const initializeGameWrapper = useCallback((gameConfig = { isRandomRole: true, selectedRole: null }) => {
    console.log('[GAME_INIT] Received config:', gameConfig);
    
    // Clear previous logs
    logManager.clearLogs();
    
    addPublicLog(t('gameInit.initializing'), 'system', LOG_CATEGORIES.GAME_FLOW);
    const configWithLanguage = { ...gameConfig, language: currentLanguage };
    const { newPlayers, humanId } = initializePlayers(configWithLanguage);
    setHumanPlayerId(humanId);
    setPlayers(newPlayers);
    
    // Log role assignment info
    const humanPlayer = newPlayers.find(p => p.isHuman);
    console.log('[GAME_INIT] Human player assigned role:', humanPlayer.role);
    if (gameConfig.isRandomRole) {
      addPublicLog(t('gameInit.randomRoleAssigned'), 'system', LOG_CATEGORIES.GAME_FLOW);
    } else {
      addPublicLog(t('gameInit.selectedRoleAssigned', { role: tr(humanPlayer.role) }), 'system', LOG_CATEGORIES.GAME_FLOW);
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
  }, [addPublicLog, t, tr, currentLanguage]);

  const handleAIVoting = useCallback(async () => {
    console.debug("[HANDLE_AI_VOTING] Starting AI voting process.");
    const aliveAIPlayers = players.filter(p => p.isAlive && !p.isHuman);
    let newVotesCollectedThisTurn = {}; // Collect new votes here
    let anyNewVotes = false;

    for (const aiPlayer of aliveAIPlayers) {
        // Only process AI if they haven't voted yet
        if (!currentVotes.hasOwnProperty(aiPlayer.id)) {
            const aiVoteTargetIdStr = await getAIDecisionWrapper(aiPlayer, 'VOTE_PLAYER');
            const aiVoteTargetId = parseInt(aiVoteTargetIdStr, 10);
            if (!isNaN(aiVoteTargetId) && players.find(p => p.id === aiVoteTargetId)?.isAlive && aiVoteTargetId !== aiPlayer.id) {
                newVotesCollectedThisTurn[aiPlayer.id] = aiVoteTargetId;
                logManager.addVotingLog(aiPlayer.id, aiVoteTargetId, aiPlayer.role);
                anyNewVotes = true;
            } else {
                const possibleTargets = players.filter(p => p.isAlive && p.id !== aiPlayer.id);
                if (possibleTargets.length > 0) {
                    const randomTarget = possibleTargets[Math.floor(Math.random() * possibleTargets.length)].id;
                    newVotesCollectedThisTurn[aiPlayer.id] = randomTarget;
                    addPublicLog(t('aiVoting.playerVotedRandom', { aiPlayerId: aiPlayer.id, targetId: randomTarget }), 'ai', LOG_CATEGORIES.VOTING);
                    anyNewVotes = true;
                } else {
                    newVotesCollectedThisTurn[aiPlayer.id] = null; // Explicitly mark as abstained if no valid target
                    addPublicLog(t('aiVoting.playerAbstained', { aiPlayerId: aiPlayer.id }), 'ai', LOG_CATEGORIES.VOTING);
                    anyNewVotes = true;
                }
            }
        }
    }
    
    if (anyNewVotes) {
        setCurrentVotes(prevVotes => ({ ...prevVotes, ...newVotesCollectedThisTurn }));
        
        // Update UI logs after new votes
        const humanPlayer = players.find(p => p.isHuman);
        if (humanPlayer) {
          const logsForHuman = logManager.getUILogsForPlayer(humanPlayer.id, humanPlayer.role, humanPlayer.id);
          setGameLog(logsForHuman);
        }
    }
    console.debug("[HANDLE_AI_VOTING] Finished AI voting process. Current votes:", currentVotes, "New votes collected:", newVotesCollectedThisTurn);
    // The decision to move to VOTE_RESULTS will be handled by the main useEffect
  }, [players, currentVotes, getAIDecisionWrapper, addPublicLog, t]);

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
    addPublicLog,
    addPrivateLog,
    addNightActionLog,
    getAIDecisionWrapper,
    checkWinConditionWrapper,
    resolveNightActions,
    resolveVoting,
    handleNextSpeaker,
    initializeGame: initializeGameWrapper,
    handleAIVoting
  };
}; 