import React, { useCallback, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
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
import AITuningTool from './components/AITuningTool';

// Navigation component
const Navigation = () => {
  const location = useLocation();
  const { t } = useLanguage();
  
  return (
    <nav className="fixed top-4 right-4 z-50 flex gap-2">
      <Link
        to="/"
        className={`px-4 py-2 rounded-lg border transition-all duration-200 ${
          location.pathname === '/'
            ? 'bg-purple-600 border-purple-400 text-white'
            : 'bg-gray-800/80 border-gray-600 text-gray-300 hover:border-purple-400/50 hover:bg-purple-900/30'
        }`}
      >
        🎮 {t('nav.game', 'Game')}
      </Link>
      <Link
        to="/ai-tuning"
        className={`px-4 py-2 rounded-lg border transition-all duration-200 ${
          location.pathname === '/ai-tuning'
            ? 'bg-purple-600 border-purple-400 text-white'
            : 'bg-gray-800/80 border-gray-600 text-gray-300 hover:border-purple-400/50 hover:bg-purple-900/30'
        }`}
      >
        🔧 {t('nav.aiTuning', 'AI Tuning')}
      </Link>
    </nav>
  );
};

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

    const humanPlayerObj = players.find(p => p.isHuman);
    
    // Log the action
    logManager.logPlayerAction(humanPlayerId, actionType, targetId);
    
    switch (actionType) {
      case 'vote':
        gameLogic.handleVote(humanPlayerId, targetId);
        addPublicLog(t('actions.playerVoted', { voterId: humanPlayerId, targetId }), 'human', LOG_CATEGORIES.VOTING);
        break;
        
      case 'target':
        if (humanPlayerObj?.role === ROLES.WEREWOLF && gamePhase === GAME_PHASES.NIGHT_WEREWOLF) {
          gameLogic.setWerewolfTarget(targetId);
          addNightActionLog(t('actions.werewolfTargeted', { targetId }), 'werewolf', LOG_CATEGORIES.NIGHT_ACTION);
        }
        break;
        
      case 'check':
        if (humanPlayerObj?.role === ROLES.SEER && gamePhase === GAME_PHASES.NIGHT_SEER) {
          const targetPlayer = players.find(p => p.id === targetId);
          const isWerewolf = targetPlayer?.role === ROLES.WEREWOLF;
          gameLogic.setSeerCheck(targetId, isWerewolf);
          addPrivateLog(
            t('actions.seerChecked', { targetId, result: isWerewolf ? t('roles.werewolf') : t('roles.notWerewolf') }), 
            'seer', 
            [humanPlayerId], 
            LOG_CATEGORIES.NIGHT_ACTION
          );
        }
        break;
        
      case 'guard':
        if (humanPlayerObj?.role === ROLES.GUARD && gamePhase === GAME_PHASES.NIGHT_GUARD) {
          gameLogic.setGuardProtection(targetId);
          addNightActionLog(t('actions.guardProtected', { targetId }), 'guard', LOG_CATEGORIES.NIGHT_ACTION);
        }
        break;
        
      case 'heal':
        if (humanPlayerObj?.role === ROLES.WITCH && gamePhase === GAME_PHASES.NIGHT_WITCH) {
          gameLogic.useWitchHeal(targetId);
          addNightActionLog(t('actions.witchHealed', { targetId }), 'witch', LOG_CATEGORIES.NIGHT_ACTION);
        }
        break;
        
      case 'poison':
        if (humanPlayerObj?.role === ROLES.WITCH && gamePhase === GAME_PHASES.NIGHT_WITCH) {
          gameLogic.useWitchPoison(targetId);
          addNightActionLog(t('actions.witchPoisoned', { targetId }), 'witch', LOG_CATEGORIES.NIGHT_ACTION);
        }
        break;
        
      case 'shoot':
        if (humanPlayerObj?.role === ROLES.HUNTER && gamePhase === GAME_PHASES.HUNTER_SHOOT) {
          gameLogic.setHunterTarget(targetId);
          addPublicLog(t('actions.hunterShot', { targetId }), 'hunter', LOG_CATEGORIES.GAME_EVENT);
        }
        break;
        
      default:
        console.warn('Unknown action type:', actionType);
    }
  };

  // Handle game start
  const handleStartGame = useCallback((config) => {
    const { isRandomRole, selectedRole } = config;
    initializeGame(isRandomRole, selectedRole);
    
    // Log game start
    logManager.logGameStart();
    
    addLog(
      isRandomRole 
        ? t('gameInfo.gameStartedRandom')
        : t('gameInfo.gameStartedSelected', { role: tr(selectedRole) }), 
      'system', 
      true,
      LOG_CATEGORIES.GAME_EVENT
    );
  }, [initializeGame, addLog, t, tr]);

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

// Router component with routes
const RouterComponent = () => {
  const [languageSelected, setLanguageSelected] = useState(false);

  return (
    <Router>
      <Navigation />
      <Routes>
        <Route 
          path="/" 
          element={
            !languageSelected ? (
              <LanguageSelection onLanguageSelected={() => setLanguageSelected(true)} />
            ) : (
              <GameComponent />
            )
          } 
        />
        <Route path="/ai-tuning" element={<AITuningTool />} />
      </Routes>
    </Router>
  );
};

// Main App component
const App = () => {
  return (
    <LanguageProvider>
      <RouterComponent />
    </LanguageProvider>
  );
};

export default App;
