import React, { useCallback, useState } from 'react';
import { GAME_PHASES, ROLES } from './constants/gameConstants';
import { useGameLogic } from './hooks/useGameLogic';
import { useGamePhaseManager } from './hooks/useGamePhaseManager';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { useTextToSpeech } from './hooks/useTextToSpeech';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { logManager, LOG_CATEGORIES } from './utils/logManager';
import LanguageSelection from './components/LanguageSelection';
import SetupScreen from './components/SetupScreen';
import GameOverScreen from './components/GameOverScreen';
import RoleModal from './components/RoleModal';
import GameInfo from './components/GameInfo';
import ActionPanel from './components/ActionPanel';
import GameLog from './components/GameLog';
import PlayerCard from './components/PlayerCard';
import TTSControls from './components/TTSControls';

const GameComponent = () => {
  const { currentLanguage, t, tr, tp } = useLanguage();
  
  // Use the main game logic hook
  const gameLogic = useGameLogic();
  
  // Use text-to-speech hook
  const tts = useTextToSpeech();

  // Use the game phase manager hook
  useGamePhaseManager(gameLogic, tts);
  
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
    addPublicLog,
    addPrivateLog,
    addNightActionLog,
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
      // Record human speech in discussion category for complete history
      addPublicLog(t('speech.yourSpeech', { id: humanPlayerId, text: humanPlayerSpeech }), 'human', LOG_CATEGORIES.DISCUSSION);
    } else {
      addPublicLog(t('speech.skipSpeech', { id: humanPlayerId }), 'human', LOG_CATEGORIES.DISCUSSION);
    }
    setHumanPlayerSpeech('');
    gameLogic.handleNextSpeaker();
  }, [humanPlayerSpeech, humanPlayerId, addPublicLog, setHumanPlayerSpeech, gameLogic, t]);

  // Handle player actions
  const handlePlayerAction = async (actionType, targetId) => {
    if (winner || isProcessingStepRef.current) return; 

    isProcessingStepRef.current = true; 
    console.debug(`[HANDLE_PLAYER_ACTION] Action: ${actionType}, Target: ${targetId}, Current Phase: ${gamePhase}`);
    const humanPlayer = players.find(p => p.isHuman);
    if (!humanPlayer || !humanPlayer.isAlive && !(humanPlayer.role === ROLES.HUNTER && gamePhase === GAME_PHASES.HUNTER_MAY_ACT)) {
        addPublicLog(t('errors.cannotAction'), 'system'); 
        isProcessingStepRef.current = false;
        return;
    }
    let nextPhaseToSet = null;

    switch (gamePhase) {
      case GAME_PHASES.WEREWOLVES_ACT:
        if (humanPlayer.role === ROLES.WEREWOLF) {
          if (targetId === null || targetId === undefined) { addPublicLog(t('errors.needTarget'), 'system'); isProcessingStepRef.current = false; return; }
          const targetPlayer = players.find(p => p.id === targetId);
          if (!targetPlayer || !targetPlayer.isAlive) { addPublicLog(t('errors.invalidTarget'), 'system'); isProcessingStepRef.current = false; return; }
          gameLogic.setWerewolfTargetId(targetId);
          
          // Log werewolf action - only visible to werewolves
          addNightActionLog('werewolf_kill', {
            playerId: humanPlayer.id,
            targetId: targetId,
            wasSuccessful: true
          }, humanPlayer.role);
          
          addPrivateLog(t('actions.werewolfSelected', { playerId: targetId }), [ROLES.WEREWOLF], [humanPlayer.id], 'human');
          nextPhaseToSet = GAME_PHASES.GUARD_ACTS; 
        }
        break;
      case GAME_PHASES.GUARD_ACTS:
        if (humanPlayer.role === ROLES.GUARD) {
          if (targetId === null || targetId === undefined) { addPublicLog(t('actions.guardNeedTarget'), 'system'); isProcessingStepRef.current = false; return; }
          if (targetId === guardLastProtectedId) { addPublicLog(t('errors.cannotProtectSame'), 'system'); isProcessingStepRef.current = false; return; }
          const targetPlayer = players.find(p => p.id === targetId);
          if (!targetPlayer || !targetPlayer.isAlive) { addPublicLog(t('errors.invalidTarget'), 'system'); isProcessingStepRef.current = false; return; }
          setPlayers(prev => prev.map(p => p.id === targetId ? { ...p, isProtected: true } : p));
          gameLogic.setGuardLastProtectedId(targetId);
          
          // Log guard action - only visible to guard
          addNightActionLog('guard_protect', {
            playerId: humanPlayer.id,
            targetId: targetId
          }, humanPlayer.role);
          
          addPrivateLog(t('actions.guardSelected', { playerId: targetId }), [ROLES.GUARD], [humanPlayer.id], 'human');
          nextPhaseToSet = GAME_PHASES.SEER_ACTS;
        }
        break;
      case GAME_PHASES.SEER_ACTS:
        if (humanPlayer.role === ROLES.SEER) {
          if (targetId === null || targetId === undefined) { addPublicLog(t('actions.seerNeedTarget'), 'system'); isProcessingStepRef.current = false; return; }
          const targetPlayer = players.find(p => p.id === targetId);
          if (!targetPlayer) { addPublicLog(t('errors.invalidTarget'), 'system'); isProcessingStepRef.current = false; return; } 
          if (!targetPlayer.isAlive) { addPublicLog(t('actions.seerOnlyAlive'), 'system'); isProcessingStepRef.current = false; return;}
          const revealedRole = targetPlayer.role;
          gameLogic.setSeerLastCheck({ targetId, targetRole: revealedRole });
          console.info(`[SEER PRIVATE] Player ${humanPlayerId} (Seer) checked Player ${targetId}: ${revealedRole}`);
          
          // Log seer action - only visible to seer, including the result
          addNightActionLog('seer_check', {
            playerId: humanPlayer.id,
            targetId: targetId,
            reason: tr(revealedRole)
          }, humanPlayer.role);
          
          addPrivateLog(t('actions.seerChecked', { playerId: targetId }), [ROLES.SEER], [humanPlayer.id], 'human'); 
          nextPhaseToSet = GAME_PHASES.WITCH_ACTS_SAVE;
        }
        break;
      case GAME_PHASES.WITCH_ACTS_SAVE:
        if (humanPlayer.role === ROLES.WITCH) { 
          const targetPlayer = players.find(p => p.id === werewolfTargetId);
          if (actionType === 'USE_ANTIDOTE' && witchPotions.antidote) {
            if (!targetPlayer || !targetPlayer.isAlive || !werewolfTargetId) {
                addPublicLog(t('actions.antidoteNoTarget'), 'system');
            } else {
                setPlayers(prev => prev.map(p => p.id === werewolfTargetId ? { ...p, isHealedByWitch: true } : p));
                gameLogic.setWitchPotions(prev => ({ ...prev, antidote: false }));
                
                // Log witch save action - only visible to witch
                addNightActionLog('witch_save', {
                  playerId: humanPlayer.id,
                  targetId: werewolfTargetId
                }, humanPlayer.role);
                
                addPrivateLog(t('actions.usedAntidote', { playerId: werewolfTargetId }), [ROLES.WITCH], [humanPlayer.id], 'human');
            }
          } else if (actionType === 'SKIP_ANTIDOTE' || !witchPotions.antidote) { 
            addPrivateLog(t('actions.skippedAntidote', { reason: !witchPotions.antidote ? ` (${t('gameInfo.antidoteUsed')})` : '' }), [ROLES.WITCH], [humanPlayer.id], 'human');
          }
        }
        setGamePhase(GAME_PHASES.WITCH_ACTS_POISON); 
        isProcessingStepRef.current = false;
        return; 
      case GAME_PHASES.WITCH_ACTS_POISON:
        if (humanPlayer.role === ROLES.WITCH) {
          if (actionType === 'USE_POISON' && targetId !== null && witchPotions.poison) {
            const targetPlayer = players.find(p => p.id === targetId);
            if (!targetPlayer || !targetPlayer.isAlive) { addPublicLog(t('errors.invalidTarget'), 'system'); isProcessingStepRef.current = false; return; }
            if (targetPlayer.id === humanPlayer.id) { addPublicLog(t('errors.witchCannotPoisonSelf'), 'system'); isProcessingStepRef.current = false; return;}
            gameLogic.setPlayerToPoisonId(targetId);
            gameLogic.setWitchPotions(prev => ({ ...prev, poison: false }));
            
            // Log witch poison action - only visible to witch
            addNightActionLog('witch_poison', {
              playerId: humanPlayer.id,
              targetId: targetId
            }, humanPlayer.role);
            
            addPrivateLog(t('actions.usedPoison', { playerId: targetId }), [ROLES.WITCH], [humanPlayer.id], 'human');
          } else if (actionType === 'SKIP_POISON' || !witchPotions.poison) {
            addPrivateLog(t('actions.skippedPoison', { reason: !witchPotions.poison ? ` (${t('gameInfo.poisonUsed')})` : '' }), [ROLES.WITCH], [humanPlayer.id], 'human');
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
                if (!targetPlayer || !targetPlayer.isAlive) { addPublicLog(t('errors.invalidTarget'), 'system'); isProcessingStepRef.current = false; return; }
                if (targetPlayer.id === deadOrVotedHunter.id) { addPublicLog(t('errors.hunterCannotShootSelf'), 'system'); isProcessingStepRef.current = false; return; }
                let updatedPlayersState = players.map(p => p.id === targetId ? { ...p, isAlive: false, revealedRole: p.role } : p);
                setPlayers(updatedPlayersState); 
                addPublicLog(t('actions.hunterShot', { playerId: targetId, role: tr(targetPlayer.role) }), 'human');
                gameLogic.setHunterTargetId(targetId); 
                if (!gameLogic.checkWinConditionWrapper(updatedPlayersState)) { isProcessingStepRef.current = false; return; }
            } else { 
                addPublicLog(t('actions.hunterNoShoot'), 'human');
            }
        }
        nextPhaseToSet = GAME_PHASES.DISCUSSION; 
        break;
      case GAME_PHASES.VOTING:
        if (humanPlayer.isAlive) {
            if (targetId === null || targetId === undefined) { addPublicLog(t('errors.needVoteTarget'), 'system'); isProcessingStepRef.current = false; return; }
            const targetPlayer = players.find(p => p.id === targetId);
            if (!targetPlayer || !targetPlayer.isAlive) { addPublicLog(t('errors.invalidTarget'), 'system'); isProcessingStepRef.current = false; return; }
            if (targetPlayer.id === humanPlayer.id) { addPublicLog(t('errors.cannotVoteSelf'), 'system'); isProcessingStepRef.current = false; return; }
            
            gameLogic.setCurrentVotes(prev => ({ ...prev, [humanPlayer.id]: targetId })); 
            // Use the voting log manager instead of direct logging
            logManager.addVotingLog(humanPlayer.id, targetId, null); // null for human voter
            
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
    <div className="min-h-screen text-gray-100 p-2 sm:p-4 flex flex-col lg:flex-row gap-3 sm:gap-6 relative overflow-hidden">
      {gamePhase === GAME_PHASES.SHOW_ROLE_MODAL && humanPlayer && (
        <RoleModal 
          humanPlayer={humanPlayer} 
          onContinue={() => {
            setShowRoleModalState(false);
            addPrivateLog(`${t('gameInfo.yourRole')}: ${tr(humanPlayer.role)}`, [], [humanPlayer.id], 'system');
            setGamePhase(GAME_PHASES.NIGHT_START);
          }}
        />
      )}

      {/* Left sidebar - Game controls */}
      <div className="lg:w-1/3 xl:w-1/4 space-y-3 sm:space-y-6 order-2 lg:order-1">
        <GameInfo 
          gamePhase={gamePhase}
          humanPlayer={humanPlayer}
          witchPotions={witchPotions}
          seerLastCheck={seerLastCheck}
        />

        <TTSControls 
          isEnabled={tts.isEnabled}
          setIsEnabled={tts.setIsEnabled}
          volume={tts.volume}
          setVolume={tts.setVolume}
          rate={tts.rate}
          setRate={tts.setRate}
          pitch={tts.pitch}
          setPitch={tts.setPitch}
          isSpeaking={tts.isSpeaking}
          isAvailable={tts.isAvailable}
          speak={tts.speak}
          stop={tts.stop}
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
          isTTSSpeaking={tts.isSpeaking}
          ttsEnabled={tts.isEnabled}
        />

        <GameLog gameLog={gameLog} />
      </div>

      {/* Right side - Player cards */}
      <div className="lg:w-2/3 xl:w-3/4 order-1 lg:order-2">
        <div className="player-grid grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
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
