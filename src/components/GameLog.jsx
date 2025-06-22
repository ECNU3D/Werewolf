import { useLanguage } from '../contexts/LanguageContext';
import { useTextToSpeech } from '../hooks/useTextToSpeech';

const GameLog = ({ gameLog }) => {
  const { t } = useLanguage();
  const { speakSystemMessage, isSpeaking, stop, isEnabled, currentSpeechType, isAvailable } = useTextToSpeech();

  // Handle playing a specific log entry
  const handlePlayLogEntry = async (logEntry, event) => {
    event?.stopPropagation();
    
    if (isSpeaking) {
      stop();
      return;
    }

    if (!isEnabled || !speakSystemMessage) {
      console.debug('TTS is disabled or not available, cannot play log entry');
      return;
    }

    try {
      await speakSystemMessage(logEntry.text);
    } catch (error) {
      console.error('Error speaking log entry:', error);
      // Don't throw the error, just log it
    }
  };

  // Handle playing all system messages in sequence
  const handlePlayAllSystemMessages = async (event) => {
    event?.stopPropagation();
    
    if (isSpeaking) {
      stop();
      return;
    }

    if (!isEnabled || !speakSystemMessage) {
      console.debug('TTS is disabled or not available, cannot play system messages');
      return;
    }

    try {
      // Filter for system and AI messages, and play them in chronological order
      const systemMessages = gameLog.filter(log => log.type === 'system' || log.type === 'ai');
      
      for (let i = 0; i < systemMessages.length; i++) {
        const message = systemMessages[i];
        await speakSystemMessage(message.text);
        
        // Small pause between messages, but only if not the last message
        if (i < systemMessages.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    } catch (error) {
      console.error('Error speaking system messages:', error);
      // Don't throw the error, just log it
    }
  };

  return (
    <div className="bg-gradient-to-br from-gray-800/90 via-gray-900/90 to-purple-900/90 p-6 rounded-xl shadow-2xl border border-purple-400/30 backdrop-filter backdrop-blur-sm relative overflow-hidden">
      {/* Atmospheric background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-transparent to-blue-900/10 pointer-events-none"></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mr-3">
              <span className="text-white font-bold">📋</span>
            </div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent">
              {t('gameLog.title') || 'Game Log'}
            </h3>
          </div>
          
          {/* Global TTS Control */}
          {isEnabled && isAvailable && speakSystemMessage && gameLog.some(log => log.type === 'system' || log.type === 'ai') && (
            <button
              onClick={handlePlayAllSystemMessages}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 border border-purple-400/30 transition-all duration-200 group"
              title={isSpeaking && currentSpeechType === 'system' ? t('tts.stopSpeaking') : 'Play All System Messages'}
              aria-label={isSpeaking && currentSpeechType === 'system' ? t('tts.stopSpeaking') : 'Play All System Messages'}
            >
              {isSpeaking && currentSpeechType === 'system' ? (
                <>
                  <span className="text-red-400 text-sm animate-pulse">⏹️</span>
                  <span className="text-red-300 text-xs hidden sm:inline">Stop</span>
                </>
              ) : (
                <>
                  <span className="text-purple-400 text-sm group-hover:text-purple-300 transition-colors">🎵</span>
                  <span className="text-purple-300 text-xs hidden sm:inline">Play All</span>
                </>
              )}
            </button>
          )}
        </div>
        
        <div className="h-80 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
          {gameLog.slice().reverse().map((log, index) => (
            <div 
              key={index} 
              className={`log-entry ${getLogTypeClass(log.type)} rounded-lg transition-all duration-300 hover:scale-[1.02] group relative`}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0 mr-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${getLogDotColor(log.type)}`}></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-medium ${getLogTagColor(log.type)}`}>
                      {getLogTypeLabel(log.type, t)}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">
                        {log.timestamp}
                      </span>
                      {/* TTS Control Button - Show on hover for system messages */}
                      {(log.type === 'system' || log.type === 'ai') && isEnabled && isAvailable && speakSystemMessage && (
                        <button
                          onClick={(e) => handlePlayLogEntry(log, e)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded-full hover:bg-gray-600/50 focus:outline-none focus:ring-2 focus:ring-purple-300/20"
                          title={isSpeaking && currentSpeechType === 'system' ? t('tts.stopSpeaking') : t('tts.playMessage')}
                          aria-label={isSpeaking && currentSpeechType === 'system' ? t('tts.stopSpeaking') : t('tts.playMessage')}
                        >
                          {isSpeaking && currentSpeechType === 'system' ? (
                            <span className="text-red-400 text-sm animate-pulse">⏹️</span>
                          ) : (
                            <span className="text-purple-400 text-sm hover:text-purple-300 transition-colors">🔊</span>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                  <p className={`text-sm leading-relaxed break-words ${getLogTextColor(log.type)}`}>
                    {log.text}
                  </p>
                </div>
              </div>
            </div>
          ))}
          
          {gameLog.length === 0 && (
            <div className="text-center py-8">
              <div className="text-4xl mb-2 opacity-50">🌙</div>
              <p className="text-gray-400">{t('gameLog.notStarted')}</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute top-2 right-2 w-12 h-12 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full pointer-events-none"></div>
      <div className="absolute bottom-2 left-2 w-8 h-8 bg-gradient-to-tr from-blue-500/10 to-transparent rounded-full pointer-events-none"></div>
    </div>
  );
};

// Helper functions for log styling
const getLogTypeClass = (type) => {
  switch (type) {
    case 'human':
      return 'log-human';
    case 'ai':
      return 'log-ai';
    case 'error':
      return 'log-error';
    default:
      return 'log-system';
  }
};

const getLogDotColor = (type) => {
  switch (type) {
    case 'human':
      return 'bg-blue-400 animate-pulse';
    case 'ai':
      return 'bg-teal-400';
    case 'error':
      return 'bg-red-400 animate-pulse';
    default:
      return 'bg-gray-400';
  }
};

const getLogTagColor = (type) => {
  switch (type) {
    case 'human':
      return 'text-blue-300';
    case 'ai':
      return 'text-teal-300';
    case 'error':
      return 'text-red-300';
    default:
      return 'text-gray-300';
  }
};

const getLogTextColor = (type) => {
  switch (type) {
    case 'human':
      return 'text-blue-100';
    case 'ai':
      return 'text-teal-100';
    case 'error':
      return 'text-red-200 font-semibold';
    default:
      return 'text-gray-200';
  }
};

const getLogTypeLabel = (type, t) => {
  switch (type) {
    case 'human':
      return t('gameLog.logTypes.human');
    case 'ai':
      return t('gameLog.logTypes.ai');
    case 'error':
      return t('gameLog.logTypes.error');
    default:
      return t('gameLog.logTypes.system');
  }
};

export default GameLog;