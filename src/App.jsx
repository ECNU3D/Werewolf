import React, { useCallback, useState } from 'react';
import { GAME_PHASES, ROLES } from './constants/gameConstants';
import { useGameLogic } from './hooks/useGameLogic';
import { useGamePhaseManager } from './hooks/useGamePhaseManager';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import LanguageSelection from './components/LanguageSelection';
import SetupScreen from './components/SetupScreen';
import GameOverScreen from './components/GameOverScreen';
import RoleModal from './components/RoleModal';
import GameInfo from './components/GameInfo';
import ActionPanel from './components/ActionPanel';
import GameLog from './components/GameLog';
import PlayerCard from './components/PlayerCard';

const GameComponent = () => {
  const { currentLanguage, t, tr, tp } = useLanguage();
  
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
      addLog(t('speech.yourSpeech', { id: humanPlayerId, text: humanPlayerSpeech }), 'human', true);
    } else {
      addLog(t('speech.skipSpeech', { id: humanPlayerId }), 'human', true);
    }
    setHumanPlayerSpeech('');
    gameLogic.handleNextSpeaker();
  }, [humanPlayerSpeech, humanPlayerId, addLog, setHumanPlayerSpeech, gameLogic, t]);

  // Handle player actions
  const handlePlayerAction = async (actionType, targetId) => {
    if (winner || isProcessingStepRef.current) return; 

    isProcessingStepRef.current = true; 
    console.debug(`[HANDLE_PLAYER_ACTION] Action: ${actionType}, Target: ${targetId}, Current Phase: ${gamePhase}`);
    const humanPlayer = players.find(p => p.isHuman);
    if (!humanPlayer || !humanPlayer.isAlive && !(humanPlayer.role === ROLES.HUNTER && gamePhase === GAME_PHASES.HUNTER_MAY_ACT)) {
        addLog(t('errors.cannotAction'), 'system', true); 
        isProcessingStepRef.current = false;
        return;
    }
    let nextPhaseToSet = null;

    switch (gamePhase) {
      case GAME_PHASES.WEREWOLVES_ACT:
        if (humanPlayer.role === ROLES.WEREWOLF) {
          if (targetId === null || targetId === undefined) { addLog(t('errors.needTarget'), 'system', true); isProcessingStepRef.current = false; return; }
          const targetPlayer = players.find(p => p.id === targetId);
          if (!targetPlayer || !targetPlayer.isAlive) { addLog(t('errors.invalidTarget'), 'system', true); isProcessingStepRef.current = false; return; }
          gameLogic.setWerewolfTargetId(targetId);
          addLog(t('actions.werewolfSelected', { playerId: targetId }), 'human', true);
          nextPhaseToSet = GAME_PHASES.GUARD_ACTS; 
        }
        break;
      case GAME_PHASES.GUARD_ACTS:
        if (humanPlayer.role === ROLES.GUARD) {
          if (targetId === null || targetId === undefined) { addLog(t('actions.guardNeedTarget'), 'system', true); isProcessingStepRef.current = false; return; }
          if (targetId === guardLastProtectedId) { addLog(t('errors.cannotProtectSame'), 'system', true); isProcessingStepRef.current = false; return; }
          const targetPlayer = players.find(p => p.id === targetId);
          if (!targetPlayer || !targetPlayer.isAlive) { addLog(t('errors.invalidTarget'), 'system', true); isProcessingStepRef.current = false; return; }
          setPlayers(prev => prev.map(p => p.id === targetId ? { ...p, isProtected: true } : p));
          gameLogic.setGuardLastProtectedId(targetId);
          addLog(t('actions.guardSelected', { playerId: targetId }), 'human', true);
          nextPhaseToSet = GAME_PHASES.SEER_ACTS;
        }
        break;
      case GAME_PHASES.SEER_ACTS:
        if (humanPlayer.role === ROLES.SEER) {
          if (targetId === null || targetId === undefined) { addLog(t('actions.seerNeedTarget'), 'system', true); isProcessingStepRef.current = false; return; }
          const targetPlayer = players.find(p => p.id === targetId);
          if (!targetPlayer) { addLog(t('errors.invalidTarget'), 'system', true); isProcessingStepRef.current = false; return; } 
          if (!targetPlayer.isAlive) { addLog(t('actions.seerOnlyAlive'), 'system', true); isProcessingStepRef.current = false; return;}
          const revealedRole = targetPlayer.role;
          gameLogic.setSeerLastCheck({ targetId, targetRole: revealedRole });
          console.info(`[SEER PRIVATE] Player ${humanPlayerId} (Seer) checked Player ${targetId}: ${revealedRole}`);
          addLog(t('actions.seerChecked', { playerId: targetId }), 'human', true); 
          nextPhaseToSet = GAME_PHASES.WITCH_ACTS_SAVE;
        }
        break;
      case GAME_PHASES.WITCH_ACTS_SAVE:
        if (humanPlayer.role === ROLES.WITCH) { 
          const targetPlayer = players.find(p => p.id === werewolfTargetId);
          if (actionType === 'USE_ANTIDOTE' && witchPotions.antidote) {
            if (!targetPlayer || !targetPlayer.isAlive || !werewolfTargetId) {
                addLog(t('actions.antidoteNoTarget'), 'system', true);
            } else {
                setPlayers(prev => prev.map(p => p.id === werewolfTargetId ? { ...p, isHealedByWitch: true } : p));
                gameLogic.setWitchPotions(prev => ({ ...prev, antidote: false }));
                addLog(t('actions.usedAntidote', { playerId: werewolfTargetId }), 'human', true);
            }
          } else if (actionType === 'SKIP_ANTIDOTE' || !witchPotions.antidote) { 
            addLog(t('actions.skippedAntidote', { reason: !witchPotions.antidote ? ` (${t('gameInfo.antidoteUsed')})` : '' }), 'human', true);
          }
        }
        setGamePhase(GAME_PHASES.WITCH_ACTS_POISON); 
        isProcessingStepRef.current = false;
        return; 
      case GAME_PHASES.WITCH_ACTS_POISON:
        if (humanPlayer.role === ROLES.WITCH) {
          if (actionType === 'USE_POISON' && targetId !== null && witchPotions.poison) {
            const targetPlayer = players.find(p => p.id === targetId);
            if (!targetPlayer || !targetPlayer.isAlive) { addLog(t('errors.invalidTarget'), 'system', true); isProcessingStepRef.current = false; return; }
            if (targetPlayer.id === humanPlayer.id) { addLog(t('errors.witchCannotPoisonSelf'), 'system', true); isProcessingStepRef.current = false; return;}
            gameLogic.setPlayerToPoisonId(targetId);
            gameLogic.setWitchPotions(prev => ({ ...prev, poison: false }));
            addLog(t('actions.usedPoison', { playerId: targetId }), 'human', true);
          } else if (actionType === 'SKIP_POISON' || !witchPotions.poison) {
            addLog(t('actions.skippedPoison', { reason: !witchPotions.poison ? ` (${t('gameInfo.poisonUsed')})` : '' }), 'human', true);
            gameLogic.setPlayerToPoisonId(null);
          }
        }
        nextPhaseToSet = GAME_PHASES.NIGHT_RESOLUTION;
        break;
      case GAME_PHASES.HUNTER_MAY_ACT:
        const deadOrVotedHunter = players.find(p => p.id === humanPlayer.id && p.role === ROLES.HUNTER && !p.isAlive);
        if (deadOrVotedHunter) {
            if (actionType === 'HUNTER_SHOOT' && targetId !== null) {
                const targetPlayer = players.find(p => p.id === targetId);
                if (!targetPlayer || !targetPlayer.isAlive) { addLog(t('errors.invalidTarget'), 'system', true); isProcessingStepRef.current = false; return; }
                if (targetPlayer.id === deadOrVotedHunter.id) { addLog(t('errors.hunterCannotShootSelf'), 'system', true); isProcessingStepRef.current = false; return; }
                let updatedPlayersState = players.map(p => p.id === targetId ? { ...p, isAlive: false, revealedRole: p.role } : p);
                setPlayers(updatedPlayersState); 
                addLog(t('actions.hunterShot', { playerId: targetId, role: tr(targetPlayer.role) }), 'human', true);
                gameLogic.setHunterTargetId(targetId); 
                if (!gameLogic.checkWinConditionWrapper(updatedPlayersState)) { isProcessingStepRef.current = false; return; }
            } else { 
                addLog(t('actions.hunterNoShoot'), 'human', true);
            }
        }
        nextPhaseToSet = GAME_PHASES.DISCUSSION; 
        break;
      case GAME_PHASES.VOTING:
        if (humanPlayer.isAlive) {
            if (targetId === null || targetId === undefined) { addLog(t('errors.needVoteTarget'), 'system', true); isProcessingStepRef.current = false; return; }
            const targetPlayer = players.find(p => p.id === targetId);
            if (!targetPlayer || !targetPlayer.isAlive) { addLog(t('errors.invalidTarget'), 'system', true); isProcessingStepRef.current = false; return; }
            if (targetPlayer.id === humanPlayer.id) { addLog(t('errors.cannotVoteSelf'), 'system', true); isProcessingStepRef.current = false; return; }
            
            gameLogic.setCurrentVotes(prev => ({ ...prev, [humanPlayer.id]: targetId })); 
            addLog(t('actions.voted', { playerId: targetId }), 'human', true);
            
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

  // Enhanced initializeGame that includes language
  const handleStartGame = useCallback((gameConfig) => {
    const configWithLanguage = {
      ...gameConfig,
      language: currentLanguage
    };
    initializeGame(configWithLanguage);
  }, [initializeGame, currentLanguage]);

  // Early returns for different game states
  if (players.length === 0 && gamePhase === GAME_PHASES.SETUP) {
    return <SetupScreen onStartGame={handleStartGame} />;
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
            addLog(`${t('gameInfo.yourRole')}: ${tr(humanPlayer.role)}`, 'system', true);
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

// Main App component with language selection
const App = () => {
  const [languageSelected, setLanguageSelected] = useState(false);

  return (
    <LanguageProvider>
      {!languageSelected ? (
        <LanguageSelection onLanguageSelected={() => setLanguageSelected(true)} />
      ) : (
        <GameComponent />
      )}
    </LanguageProvider>
  );
};

export default App;
