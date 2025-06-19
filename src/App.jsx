import React, { useCallback } from 'react';
import { GAME_PHASES } from './constants/gameConstants';
import { useGameLogic } from './hooks/useGameLogic';
import { useGamePhaseManager } from './hooks/useGamePhaseManager';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import SetupScreen from './components/SetupScreen';
import GameOverScreen from './components/GameOverScreen';
import RoleModal from './components/RoleModal';
import GameInfo from './components/GameInfo';
import ActionPanel from './components/ActionPanel';
import GameLog from './components/GameLog';
import PlayerCard from './components/PlayerCard';

const App = () => {
  // Use the main game logic hook
  const gameLogic = useGameLogic();
  
  // Use the game phase manager hook
  useGamePhaseManager(gameLogic);
  
  // Extract values from game logic hook
  const {
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
    setShowRoleModalState,
    setGamePhase,
    setPlayers,
    setWinner,
    addLog,
    initializeGame,
    handleAIVoting
  } = gameLogic;

  // Get human player
  const humanPlayer = players.find(p => p.isHuman);

  // Use speech recognition hook
  const {
    isListening,
    humanPlayerSpeech,
    setHumanPlayerSpeech,
    toggleListen
  } = useSpeechRecognition(humanPlayerId, addLog);

  // Handle speech submission
  const handleSpeechSubmission = useCallback(() => {
    if (humanPlayerSpeech.trim()) {
      addLog(`你 (玩家 ${humanPlayerId}) 说: ${humanPlayerSpeech}`, 'human', true);
    } else {
      addLog(`你 (玩家 ${humanPlayerId}) 选择跳过发言。`, 'human', true);
    }
    setHumanPlayerSpeech('');
    gameLogic.handleNextSpeaker();
  }, [humanPlayerSpeech, humanPlayerId, addLog, setHumanPlayerSpeech, gameLogic]);

  // Handle player actions
  const handlePlayerAction = async (actionType, targetId) => {
    if (winner || isProcessingStepRef.current) return; 

    isProcessingStepRef.current = true; 
    console.debug(`[HANDLE_PLAYER_ACTION] Action: ${actionType}, Target: ${targetId}, Current Phase: ${gamePhase}`);
    const humanPlayer = players.find(p => p.isHuman);
    if (!humanPlayer || !humanPlayer.isAlive && !(humanPlayer.role === 'HUNTER' && gamePhase === GAME_PHASES.HUNTER_MAY_ACT)) {
        addLog("你无法行动。", 'system', true); 
        isProcessingStepRef.current = false;
        return;
    }
    let nextPhaseToSet = null;

    switch (gamePhase) {
      case GAME_PHASES.WEREWOLVES_ACT:
        if (humanPlayer.role === '狼人') {
          if (targetId === null || targetId === undefined) { addLog("你需要选择一个目标。", 'system', true); isProcessingStepRef.current = false; return; }
          const targetPlayer = players.find(p => p.id === targetId);
          if (!targetPlayer || !targetPlayer.isAlive) { addLog("目标无效或已死亡。", 'system', true); isProcessingStepRef.current = false; return; }
          gameLogic.setWerewolfTargetId(targetId);
          addLog(`你选择了攻击玩家 ${targetId}。`, 'human', true);
          nextPhaseToSet = GAME_PHASES.GUARD_ACTS; 
        }
        break;
      case GAME_PHASES.GUARD_ACTS:
        if (humanPlayer.role === '守卫') {
          if (targetId === null || targetId === undefined) { addLog("你需要选择守护一名玩家。", 'system', true); isProcessingStepRef.current = false; return; }
          if (targetId === guardLastProtectedId) { addLog("不能连续两晚守护同一个人。", 'system', true); isProcessingStepRef.current = false; return; }
          const targetPlayer = players.find(p => p.id === targetId);
          if (!targetPlayer || !targetPlayer.isAlive) { addLog("目标无效或已死亡。", 'system', true); isProcessingStepRef.current = false; return; }
          setPlayers(prev => prev.map(p => p.id === targetId ? { ...p, isProtected: true } : p));
          gameLogic.setGuardLastProtectedId(targetId);
          addLog(`你选择了守护玩家 ${targetId}。`, 'human', true);
          nextPhaseToSet = GAME_PHASES.SEER_ACTS;
        }
        break;
      case GAME_PHASES.SEER_ACTS:
        if (humanPlayer.role === '预言家') {
          if (targetId === null || targetId === undefined) { addLog("你需要选择查验一名玩家。", 'system', true); isProcessingStepRef.current = false; return; }
          const targetPlayer = players.find(p => p.id === targetId);
          if (!targetPlayer) { addLog("目标无效。", 'system', true); isProcessingStepRef.current = false; return; } 
          if (!targetPlayer.isAlive) { addLog("通常只能查验存活的玩家。", 'system', true); isProcessingStepRef.current = false; return;}
          const revealedRole = targetPlayer.role;
          gameLogic.setSeerLastCheck({ targetId, targetRole: revealedRole });
          console.info(`[SEER PRIVATE] 玩家 ${humanPlayerId} (预言家) 查验玩家 ${targetId}: ${revealedRole}`);
          addLog(`你查验了玩家 ${targetId}。`, 'human', true); 
          nextPhaseToSet = GAME_PHASES.WITCH_ACTS_SAVE;
        }
        break;
      case GAME_PHASES.WITCH_ACTS_SAVE:
        if (humanPlayer.role === '女巫') { 
          const targetPlayer = players.find(p => p.id === werewolfTargetId);
          if (actionType === 'USE_ANTIDOTE' && witchPotions.antidote) {
            if (!targetPlayer || !targetPlayer.isAlive || !werewolfTargetId) {
                addLog("无人被狼人攻击，或目标已死亡，无法使用解药。", 'system', true);
            } else {
                setPlayers(prev => prev.map(p => p.id === werewolfTargetId ? { ...p, isHealedByWitch: true } : p));
                gameLogic.setWitchPotions(prev => ({ ...prev, antidote: false }));
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
        if (humanPlayer.role === '女巫') {
          if (actionType === 'USE_POISON' && targetId !== null && witchPotions.poison) {
            const targetPlayer = players.find(p => p.id === targetId);
            if (!targetPlayer || !targetPlayer.isAlive) { addLog("目标无效或已死亡。", 'system', true); isProcessingStepRef.current = false; return; }
            if (targetPlayer.id === humanPlayer.id) { addLog("女巫不能毒自己。", 'system', true); isProcessingStepRef.current = false; return;}
            gameLogic.setPlayerToPoisonId(targetId);
            gameLogic.setWitchPotions(prev => ({ ...prev, poison: false }));
            addLog(`你对玩家 ${targetId} 使用了毒药。`, 'human', true);
          } else if (actionType === 'SKIP_POISON' || !witchPotions.poison) {
            addLog(`你选择不使用毒药${!witchPotions.poison ? ' (已无毒药)' : ''}。`, 'human', true);
            gameLogic.setPlayerToPoisonId(null);
          }
        }
        nextPhaseToSet = GAME_PHASES.NIGHT_RESOLUTION;
        break;
      case GAME_PHASES.HUNTER_MAY_ACT:
        const deadOrVotedHunter = players.find(p => p.id === humanPlayer.id && p.role === '猎人' && !p.isAlive);
        if (deadOrVotedHunter) {
            if (actionType === 'HUNTER_SHOOT' && targetId !== null) {
                const targetPlayer = players.find(p => p.id === targetId);
                if (!targetPlayer || !targetPlayer.isAlive) { addLog("目标无效或已死亡。", 'system', true); isProcessingStepRef.current = false; return; }
                if (targetPlayer.id === deadOrVotedHunter.id) { addLog("猎人不能射杀自己。", 'system', true); isProcessingStepRef.current = false; return; }
                let updatedPlayersState = players.map(p => p.id === targetId ? { ...p, isAlive: false, revealedRole: p.role } : p);
                setPlayers(updatedPlayersState); 
                addLog(`你 (猎人) 开枪带走了玩家 ${targetId} (${targetPlayer.role})！`, 'human', true);
                gameLogic.setHunterTargetId(targetId); 
                if (!gameLogic.checkWinConditionWrapper(updatedPlayersState)) { isProcessingStepRef.current = false; return; }
            } else { 
                addLog(`你 (猎人) 选择不开枪。`, 'human', true);
            }
        }
        nextPhaseToSet = GAME_PHASES.DISCUSSION; 
        break;
      case GAME_PHASES.VOTING:
        if (humanPlayer.isAlive) {
            if (targetId === null || targetId === undefined) { addLog("你需要选择投票给一名玩家。", 'system', true); isProcessingStepRef.current = false; return; }
            const targetPlayer = players.find(p => p.id === targetId);
            if (!targetPlayer || !targetPlayer.isAlive) { addLog("目标无效或已死亡。", 'system', true); isProcessingStepRef.current = false; return; }
            if (targetPlayer.id === humanPlayer.id) { addLog("你不能投票给自己。", 'system', true); isProcessingStepRef.current = false; return; }
            
            gameLogic.setCurrentVotes(prev => ({ ...prev, [humanPlayer.id]: targetId })); 
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

  // Early returns for different game states
  if (players.length === 0 && gamePhase === GAME_PHASES.SETUP) {
    return <SetupScreen onStartGame={(gameConfig) => initializeGame(gameConfig)} />;
  }
  
  if (winner) {
    const onRestart = () => {
      setGamePhase(GAME_PHASES.SETUP);
      setPlayers([]);
      setWinner(null);
    };
    return <GameOverScreen winner={winner} players={players} onRestart={onRestart} />;
  }

  // Main game UI
  return (
    <div className="min-h-screen text-gray-100 p-4 flex flex-col md:flex-row gap-6 relative overflow-hidden">
      {gamePhase === GAME_PHASES.SHOW_ROLE_MODAL && humanPlayer && (
        <RoleModal 
          humanPlayer={humanPlayer} 
          onContinue={() => {
            setShowRoleModalState(false);
            addLog(`你的身份是: ${humanPlayer.role}`, 'system', true);
            setGamePhase(GAME_PHASES.NIGHT_START);
          }}
        />
      )}

      <div className="md:w-1/3 space-y-6">
        <GameInfo 
          gamePhase={gamePhase}
          humanPlayer={humanPlayer}
          witchPotions={witchPotions}
          seerLastCheck={seerLastCheck}
        />

        <ActionPanel 
          gamePhase={gamePhase}
          humanPlayer={humanPlayer}
          werewolfTargetId={werewolfTargetId}
          witchPotions={witchPotions}
          pendingDeathPlayerIds={pendingDeathPlayerIds}
          hunterTargetId={hunterTargetId}
          players={players}
          currentPlayerSpeakingId={currentPlayerSpeakingId}
          currentVotes={currentVotes}
          humanPlayerSpeech={humanPlayerSpeech}
          setHumanPlayerSpeech={setHumanPlayerSpeech}
          isListening={isListening}
          toggleListen={toggleListen}
          onPlayerAction={handlePlayerAction}
          onSpeechSubmission={handleSpeechSubmission}
          onNextSpeaker={gameLogic.handleNextSpeaker}
          onShowVoteResults={() => setGamePhase(GAME_PHASES.VOTE_RESULTS)}
        />

        <GameLog gameLog={gameLog} />
      </div>

      <div className="md:w-2/3">
        <div className="player-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {players.map(player => (
            <PlayerCard 
              key={player.id}
              player={player}
              humanPlayer={humanPlayer}
              gamePhase={gamePhase}
              currentPlayerSpeakingId={currentPlayerSpeakingId}
              werewolfTargetId={werewolfTargetId}
              seerLastCheck={seerLastCheck}
              guardLastProtectedId={guardLastProtectedId}
              witchPotions={witchPotions}
              currentVotes={currentVotes}
              pendingDeathPlayerIds={pendingDeathPlayerIds}
              hunterTargetId={hunterTargetId}
              players={players}
              onPlayerAction={handlePlayerAction}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default App;
