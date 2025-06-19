import { useState, useEffect, useCallback, useRef } from 'react';
import { ROLES, GAME_PHASES } from '../constants/gameConstants';
import { initializePlayers, checkWinCondition } from '../utils/gameUtils';
import { getAIDecision } from '../utils/aiUtils';
import { useLanguage } from '../contexts/LanguageContext';

export const useGameLogic = () => {
  const { t, tr } = useLanguage();
  
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
        addLog(t('gameResults.allDead'), 'system', true);
      } else if (result.winner === 'VILLAGERS') {
        addLog(t('gameResults.villagersWin'), 'system', true);
      } else if (result.winner === 'WEREWOLVES') {
        addLog(t('gameResults.werewolvesWin'), 'system', true);
      }
      setWinner(result.winner);
      setGamePhase(GAME_PHASES.GAME_OVER);
      return false;
    }
    return true;
  }, [addLog, winner, t]);

  const resolveNightActions = useCallback(() => {
    console.debug("[RESOLVE_NIGHT_ACTIONS] Starting night resolution.");
    let deathsThisNightInfo = []; 
    let messagesForUILog = []; 
    let updatedPlayers = [...players]; 
    const wolfTargetPlayer = updatedPlayers.find(p => p.id === werewolfTargetId);

    if (wolfTargetPlayer && wolfTargetPlayer.isAlive) {
      if (wolfTargetPlayer.isProtected) {
        messagesForUILog.push(t('nightActions.guardProtected', { playerId: wolfTargetPlayer.id }));
      } else if (wolfTargetPlayer.isHealedByWitch) {
        messagesForUILog.push(t('nightActions.witchSaved', { playerId: wolfTargetPlayer.id }));
      } else {
        messagesForUILog.push(t('nightActions.werewolfKilled', { playerId: wolfTargetPlayer.id })); 
        deathsThisNightInfo.push({ id: wolfTargetPlayer.id, role: wolfTargetPlayer.role, reason: t('nightActions.killedByWerewolf') });
      }
    } else if (werewolfTargetId !== null) {
       messagesForUILog.push(t('nightActions.werewolfMissed'));
    } else {
       messagesForUILog.push(t('nightActions.peacefulNight'));
    }

    const poisonedPlayer = updatedPlayers.find(p => p.id === playerToPoisonId);
    if (poisonedPlayer && poisonedPlayer.isAlive) {
      const alreadyMarkedForDeathByWolf = deathsThisNightInfo.some(d => d.id === poisonedPlayer.id);
      if (!alreadyMarkedForDeathByWolf) {
         messagesForUILog.push(t('nightActions.witchPoisoned', { playerId: poisonedPlayer.id })); 
         deathsThisNightInfo.push({ id: poisonedPlayer.id, role: poisonedPlayer.role, reason: t('nightActions.poisonedByWitch') });
      } else {
         deathsThisNightInfo = deathsThisNightInfo.filter(d => d.id !== poisonedPlayer.id); 
         messagesForUILog.push(t('nightActions.witchPoisonedMultiple', { playerId: poisonedPlayer.id }));
         deathsThisNightInfo.push({ id: poisonedPlayer.id, role: poisonedPlayer.role, reason: t('nightActions.poisonedByWitch') });
      }
    }
    
    let actualDeadIdsThisNight = [];
    if (deathsThisNightInfo.length === 0) {
      if (werewolfTargetId === null && playerToPoisonId === null && messagesForUILog.length === 0) { 
        messagesForUILog.push(t('nightActions.noneDeadPeaceful'));
      } else if (messagesForUILog.length === 0 && (werewolfTargetId !== null || playerToPoisonId !== null)) {
        if (werewolfTargetId === null && playerToPoisonId === null) { 
             messagesForUILog.push(t('nightActions.noneDeadAfterActions')); 
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
  }, [players, werewolfTargetId, playerToPoisonId, addLog, checkWinConditionWrapper, t]);

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
  }, [players, currentVotes, addLog, checkWinConditionWrapper, t, tr]);
  
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
      addLog(t('gamePhases.discussionDone'), 'system', true); 
      setGamePhase(GAME_PHASES.VOTING); 
      return;
    }
    
    console.debug(`[HANDLE_NEXT_SPEAKER_SETTING] Setting next speaker to Player ID: ${nextSpeakerToSetId}`);
    setCurrentPlayerSpeakingId(nextSpeakerToSetId); 

    const nextSpeakerDetails = players.find(p => p.id === nextSpeakerToSetId);
    if (nextSpeakerDetails) {
        addLog(t('speaking.nextSpeaker', { playerId: nextSpeakerDetails.id }), 'system', true);
    } else {
        console.error(`[HANDLE_NEXT_SPEAKER_ERROR] Could not find next speaker details for ID: ${nextSpeakerToSetId}`);
    }
  }, [currentPlayerSpeakingId, players, winner, addLog, t]);

  const initializeGameWrapper = useCallback((gameConfig = { isRandomRole: true, selectedRole: null }) => {
    console.log('[GAME_INIT] Received config:', gameConfig);
    addLog(t('gameInit.initializing'), 'system', true);
    const { newPlayers, humanId } = initializePlayers(gameConfig);
    setHumanPlayerId(humanId);
    setPlayers(newPlayers);
    
    // Log role assignment info
    const humanPlayer = newPlayers.find(p => p.isHuman);
    console.log('[GAME_INIT] Human player assigned role:', humanPlayer.role);
    if (gameConfig.isRandomRole) {
      addLog(t('gameInit.randomRoleAssigned'), 'system', true);
    } else {
      addLog(t('gameInit.selectedRoleAssigned', { role: tr(humanPlayer.role) }), 'system', true);
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
  }, [addLog, t, tr]);

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
                addLog(t('aiVoting.playerVoted', { aiPlayerId: aiPlayer.id, targetId: aiVoteTargetId }), 'ai', true);
                anyNewVotes = true;
            } else {
                const possibleTargets = players.filter(p => p.isAlive && p.id !== aiPlayer.id);
                if (possibleTargets.length > 0) {
                    const randomTarget = possibleTargets[Math.floor(Math.random() * possibleTargets.length)].id;
                    newVotesCollectedThisTurn[aiPlayer.id] = randomTarget;
                    addLog(t('aiVoting.playerVotedRandom', { aiPlayerId: aiPlayer.id, targetId: randomTarget }), 'ai', true);
                    anyNewVotes = true;
                } else {
                    newVotesCollectedThisTurn[aiPlayer.id] = null; // Explicitly mark as abstained if no valid target
                    addLog(t('aiVoting.playerAbstained', { aiPlayerId: aiPlayer.id }), 'ai', true);
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