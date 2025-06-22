import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const TTSControls = ({ 
  isEnabled, 
  setIsEnabled, 
  volume, 
  setVolume, 
  rate, 
  setRate, 
  pitch, 
  setPitch, 
  isSpeaking, 
  isAvailable,
  speak,
  stop
}) => {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isAvailable) {
    return (
      <div className="p-3 sm:p-4 bg-gray-800/50 rounded-lg border border-gray-600/50">
        <div className="flex items-center mb-2">
          <span className="text-base sm:text-lg mr-2">🔇</span>
          <span className="text-gray-300 font-medium text-sm sm:text-base">{t('tts.title')}</span>
        </div>
        <p className="text-gray-400 text-xs sm:text-sm">{t('tts.notSupported')}</p>
      </div>
    );
  }

  const handleTestVoice = () => {
    if (isSpeaking) {
      stop();
    } else {
      speak(t('tts.testMessage'));
    }
  };

  return (
    <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-xl border border-purple-400/40">
      {/* Header - Always visible */}
      <div 
        className="p-3 sm:p-4 cursor-pointer hover:bg-purple-800/20 transition-all duration-200 rounded-t-xl"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-lg sm:text-2xl mr-2">🎙️</span>
            <span className="text-purple-200 font-semibold text-sm sm:text-base">{t('tts.title')}</span>
            {/* Mobile indicator for enabled/disabled state */}
            <span className="ml-2 text-xs sm:hidden">
              {isEnabled ? '✓' : '✗'}
            </span>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Toggle switch - always visible */}
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={(e) => setIsEnabled(e.target.checked)}
                onClick={(e) => e.stopPropagation()} // Prevent expanding when clicking toggle
                className="sr-only peer"
              />
              <div className="w-8 h-4 sm:w-11 sm:h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300/20 rounded-full peer peer-checked:after:translate-x-full sm:peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] sm:after:top-[2px] after:left-[1px] sm:after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 sm:after:h-5 sm:after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              <span className="ml-2 text-xs sm:text-sm font-medium text-purple-200 hidden sm:inline">
                {isEnabled ? t('tts.enabled') : t('tts.disabled')}
              </span>
            </label>
            {/* Expand/collapse indicator */}
            <div className="text-purple-200 transform transition-transform duration-200" style={{transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'}}>
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Speaking indicator - show when collapsed and speaking */}
        {!isExpanded && isSpeaking && (
          <div className="flex items-center mt-2 p-2 bg-purple-900/30 rounded-lg border border-purple-400/30">
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-400 rounded-full animate-pulse"></div>
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-400 rounded-full animate-pulse delay-75"></div>
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-400 rounded-full animate-pulse delay-150"></div>
              </div>
              <span className="text-purple-200 text-xs sm:text-sm">{t('tts.aiSpeaking')}</span>
            </div>
          </div>
        )}
      </div>

      {/* Expanded content */}
      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
        isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="px-3 pb-3 sm:px-4 sm:pb-4 space-y-3 sm:space-y-4">
          {isEnabled && (
            <>
              {/* Volume Control */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs sm:text-sm font-medium text-purple-200">{t('tts.volume')}</label>
                  <span className="text-xs text-purple-300">{Math.round(volume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-full h-1.5 sm:h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider-thumb"
                />
              </div>

              {/* Speed Control */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs sm:text-sm font-medium text-purple-200">{t('tts.speed')}</label>
                  <span className="text-xs text-purple-300">{rate.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={rate}
                  onChange={(e) => setRate(parseFloat(e.target.value))}
                  className="w-full h-1.5 sm:h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider-thumb"
                />
              </div>

              {/* Pitch Control */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs sm:text-sm font-medium text-purple-200">{t('tts.pitch')}</label>
                  <span className="text-xs text-purple-300">{pitch.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={pitch}
                  onChange={(e) => setPitch(parseFloat(e.target.value))}
                  className="w-full h-1.5 sm:h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider-thumb"
                />
              </div>

              {/* Test Voice Button */}
              <button
                onClick={handleTestVoice}
                className={`w-full px-3 py-2 sm:px-4 sm:py-2 rounded-lg font-medium transition-all duration-300 text-sm sm:text-base ${
                  isSpeaking
                    ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white'
                    : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
                }`}
                disabled={!isEnabled}
              >
                {isSpeaking ? (
                  <>
                    <span className="mr-1 sm:mr-2">⏹️</span>
                    {t('tts.stopSpeaking')}
                  </>
                ) : (
                  <>
                    <span className="mr-1 sm:mr-2">🎵</span>
                    {t('tts.testVoice')}
                  </>
                )}
              </button>

              {/* Speaking Indicator - detailed version when expanded */}
              {isSpeaking && (
                <div className="flex items-center justify-center p-2 bg-purple-900/30 rounded-lg border border-purple-400/30">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-400 rounded-full animate-pulse"></div>
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-400 rounded-full animate-pulse delay-75"></div>
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-400 rounded-full animate-pulse delay-150"></div>
                    </div>
                    <span className="text-purple-200 text-xs sm:text-sm">{t('tts.aiSpeaking')}</span>
                  </div>
                </div>
              )}
            </>
          )}
          
          {/* Disabled state message */}
          {!isEnabled && (
            <div className="text-center py-3 sm:py-4 text-gray-400 text-xs sm:text-sm">
              {t('tts.disabled')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TTSControls; 