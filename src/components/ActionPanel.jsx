import { ROLES, GAME_PHASES } from '../constants/gameConstants';
import { useLanguage } from '../contexts/LanguageContext';

const ActionPanel = ({ 
  gamePhase,
  humanPlayer,
  werewolfTargetId,
  witchPotions,
  pendingDeathPlayerIds,
  hunterTargetId,
  players,
  currentPlayerSpeakingId,
  currentVotes,
  humanPlayerSpeech,
  setHumanPlayerSpeech,
  isListening,
  toggleListen,
  onPlayerAction,
  onSpeechSubmission,
  onNextSpeaker,
  onShowVoteResults,
  isTTSSpeaking = false,
  ttsEnabled = false
}) => {
  const { t } = useLanguage();
  
  return (
    <div className="bg-gradient-to-br from-gray-800/90 via-gray-900/90 to-purple-900/90 p-6 rounded-xl shadow-2xl border border-purple-400/30 backdrop-filter backdrop-blur-sm relative overflow-hidden">
      {/* Atmospheric background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-transparent to-blue-900/10 pointer-events-none"></div>
      
      <div className="relative z-10 space-y-4">
        <div className="flex items-center justify-center mb-4">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mr-3">
            <span className="text-white font-bold">⚡</span>
          </div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent">
            {t('actionPanel.yourAction')}
          </h3>
        </div>
        
        {/* Witch save action */}
        {gamePhase === GAME_PHASES.WITCH_ACTS_SAVE && humanPlayer?.role === ROLES.WITCH && humanPlayer.isAlive && players.find(p=>p.id === werewolfTargetId)?.isAlive && ( 
          <div className="p-4 bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-xl border border-green-400/40">
            <div className="flex items-center mb-3">
              <span className="text-2xl mr-2">🧙‍♀️</span>
              <span className="text-green-300 font-semibold">{t('actionPanel.witchSave')}</span>
            </div>
            <p className="text-center mb-4 text-green-200">
              {t('actionPanel.werewolfAttacked')} <span className="font-bold text-white">{werewolfTargetId}</span>。{t('actionPanel.useAntidoteQuestion')}
            </p>
            <div className="space-y-3">
              <button 
                onClick={() => onPlayerAction('USE_ANTIDOTE')} 
                disabled={!witchPotions.antidote} 
                className={`action-button w-full px-4 py-3 rounded-lg font-semibold shadow-lg transition-all duration-300 ${
                  witchPotions.antidote 
                    ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white' 
                    : 'bg-gray-600 opacity-50 cursor-not-allowed text-gray-300'
                }`}
              >
                💚 {witchPotions.antidote ? t('actionPanel.useAntidote') : t('gameInfo.antidoteUsed')}
              </button>
              <button 
                onClick={() => onPlayerAction('SKIP_ANTIDOTE')} 
                className="action-button w-full px-4 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 font-semibold shadow-lg"
              >
                ❌ {t('actionPanel.skipAntidote')}
              </button>
            </div>
          </div>
        )}

        {/* Witch poison action */}
        {gamePhase === GAME_PHASES.WITCH_ACTS_POISON && humanPlayer?.role === ROLES.WITCH && humanPlayer.isAlive && (
          <div className="p-4 bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-xl border border-purple-400/40">
            <div className="flex items-center mb-3">
              <span className="text-2xl mr-2">🧙‍♀️</span>
              <span className="text-purple-300 font-semibold">{t('actionPanel.witchPoison')}</span>
            </div>
            <button 
              onClick={() => onPlayerAction('SKIP_POISON')} 
              disabled={!witchPotions.poison} 
              className={`action-button w-full px-4 py-3 rounded-lg font-semibold shadow-lg transition-all duration-300 ${
                witchPotions.poison 
                  ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white' 
                  : 'bg-gray-600 opacity-50 cursor-not-allowed text-gray-300'
              }`}
            >
              {witchPotions.poison ? `☠️ ${t('actionPanel.skipPoison')}` : `🚫 ${t('gameInfo.poisonUsed')}`}
            </button>
          </div>
        )}

        {/* Hunter action */}
        {gamePhase === GAME_PHASES.HUNTER_MAY_ACT && humanPlayer?.role === ROLES.HUNTER && !humanPlayer.isAlive && 
        (pendingDeathPlayerIds.includes(humanPlayer.id) || (hunterTargetId !== null && humanPlayer.id === players.find(p => p.id === hunterTargetId && p.role === ROLES.HUNTER && !p.isAlive)?.id)) && (
          <div className="p-4 bg-gradient-to-r from-orange-900/30 to-red-900/30 rounded-xl border border-orange-400/40">
            <div className="flex items-center mb-3">
              <span className="text-2xl mr-2">🏹</span>
              <span className="text-orange-300 font-semibold">{t('actionPanel.shootTarget')}</span>
            </div>
            <button 
              onClick={() => onPlayerAction('HUNTER_SKIP_SHOOT')} 
              className="action-button w-full px-4 py-3 bg-gradient-to-r from-orange-600 to-red-700 text-white rounded-lg hover:from-orange-700 hover:to-red-800 font-semibold shadow-lg"
            >
              🙅‍♂️ {t('actionPanel.noShoot')}
            </button>
          </div>
        )}

        {/* Discussion phase - Human speaking */}
        {gamePhase === GAME_PHASES.DISCUSSION && humanPlayer?.isAlive && players.find(p=>p.id === currentPlayerSpeakingId)?.id === humanPlayer.id && (
          <div className="p-4 bg-gradient-to-r from-yellow-900/30 to-amber-900/30 rounded-xl border border-yellow-400/40">
            <div className="flex items-center mb-3">
              <span className="text-2xl mr-2">🎤</span>
              <span className="text-yellow-300 font-semibold">{t('actionPanel.yourTurn')}</span>
            </div>
            <div className="space-y-4">
              <div className="relative">
                <textarea 
                  value={humanPlayerSpeech} 
                  onChange={(e) => setHumanPlayerSpeech(e.target.value)} 
                  rows="4" 
                  className="w-full p-4 bg-gray-800/80 border-2 border-yellow-400/30 rounded-lg focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-400 text-gray-100 placeholder-gray-400 backdrop-filter backdrop-blur-sm transition-all duration-300" 
                  placeholder={t('actionPanel.enterSpeech')}
                />
                <div className="absolute top-2 right-2 text-xs text-gray-400">
                  {humanPlayerSpeech.length}/500
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={toggleListen} 
                  className={`action-button px-4 py-3 rounded-lg font-semibold shadow-lg transition-all duration-300 ${
                    isListening 
                      ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white animate-pulse' 
                      : 'bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white'
                  }`}
                >
                  {isListening ? `🔴 ${t('actionPanel.stopRecording')}` : `🎤 ${t('actionPanel.startRecording')}`}
                </button>
                <button 
                  onClick={onSpeechSubmission} 
                  className="action-button px-4 py-3 bg-gradient-to-r from-yellow-600 to-amber-600 text-white rounded-lg hover:from-yellow-700 hover:to-amber-700 font-semibold shadow-lg"
                >
                  ✅ {t('actionPanel.confirmSpeech')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Discussion phase - AI speaking */}
        {gamePhase === GAME_PHASES.DISCUSSION && humanPlayer?.isAlive && players.find(p=>p.id === currentPlayerSpeakingId)?.id !== humanPlayer.id && (
          <div className="p-4 bg-gradient-to-r from-gray-800/30 to-slate-800/30 rounded-xl border border-gray-400/40">
            <div className="flex items-center mb-3">
              <span className="text-2xl mr-2">🤖</span>
              <span className="text-gray-300 font-semibold">{t('actionPanel.aiSpeaking')}</span>
            </div>
            
            {/* TTS Status Indicator */}
            {ttsEnabled && isTTSSpeaking && (
              <div className="mb-3 p-2 bg-purple-900/30 rounded-lg border border-purple-400/30">
                <div className="flex items-center justify-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse delay-75"></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse delay-150"></div>
                  </div>
                  <span className="text-purple-200 text-sm">{t('tts.aiSpeaking')}</span>
                </div>
              </div>
            )}
            
            <button 
              onClick={onNextSpeaker} 
              className="action-button w-full px-4 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 font-semibold shadow-lg"
            >
              ⏭️ {t('actionPanel.skipAISpeech')}
            </button>
          </div>
        )}

        {/* Voting phase */}
        {gamePhase === GAME_PHASES.VOTING && humanPlayer?.isAlive && !currentVotes[humanPlayer.id] && (
          <div className="p-4 bg-gradient-to-r from-yellow-900/30 to-orange-900/30 rounded-xl border border-yellow-400/40">
            <div className="flex items-center mb-3">
              <span className="text-2xl mr-2">🗳️</span>
              <span className="text-yellow-300 font-semibold">{t('actionPanel.votingPhase')}</span>
            </div>
            <p className="text-center text-yellow-200 bg-yellow-900/20 p-3 rounded-lg border border-yellow-400/30">
              {t('actionPanel.selectTarget')}
            </p>
          </div>
        )}

        {/* Waiting for other votes */}
        {gamePhase === GAME_PHASES.VOTING && Object.keys(currentVotes).length > 0 && Object.keys(currentVotes).length < players.filter(p=>p.isAlive).length && (
          <div className="p-4 bg-gradient-to-r from-blue-900/30 to-indigo-900/30 rounded-xl border border-blue-400/40">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400 mr-3"></div>
              <span className="text-blue-300 font-medium">{t('actionPanel.waitingVotes')}</span>
            </div>
          </div>
        )}

        {/* Show vote results */}
        {gamePhase === GAME_PHASES.VOTING && players.filter(p=>p.isAlive).length > 0 && Object.keys(currentVotes).length === players.filter(p=>p.isAlive).length && (
          <div className="p-4 bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-xl border border-green-400/40">
            <button 
              onClick={onShowVoteResults} 
              className="action-button w-full px-4 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 font-bold text-lg shadow-lg"
            >
              📊 {t('common.confirm')}
            </button>
          </div>
        )}
      </div>

      {/* Decorative elements */}
      <div className="absolute -top-1 -right-1 w-20 h-20 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full pointer-events-none"></div>
      <div className="absolute -bottom-1 -left-1 w-16 h-16 bg-gradient-to-tr from-blue-500/10 to-transparent rounded-full pointer-events-none"></div>
    </div>
  );
};

export default ActionPanel; 