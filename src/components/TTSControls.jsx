import React from 'react';
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

  if (!isAvailable) {
    return (
      <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-600/50">
        <div className="flex items-center mb-2">
          <span className="text-lg mr-2">🔇</span>
          <span className="text-gray-300 font-medium">{t('tts.title')}</span>
        </div>
        <p className="text-gray-400 text-sm">{t('tts.notSupported')}</p>
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
    <div className="p-4 bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-xl border border-purple-400/40">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <span className="text-2xl mr-2">🎙️</span>
          <span className="text-purple-200 font-semibold">{t('tts.title')}</span>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={(e) => setIsEnabled(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
          <span className="ml-3 text-sm font-medium text-purple-200">
            {isEnabled ? t('tts.enabled') : t('tts.disabled')}
          </span>
        </label>
      </div>

      {isEnabled && (
        <div className="space-y-4">
          {/* Volume Control */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-purple-200">{t('tts.volume')}</label>
              <span className="text-xs text-purple-300">{Math.round(volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider-thumb"
            />
          </div>

          {/* Speed Control */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-purple-200">{t('tts.speed')}</label>
              <span className="text-xs text-purple-300">{rate.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={rate}
              onChange={(e) => setRate(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider-thumb"
            />
          </div>

          {/* Pitch Control */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-purple-200">{t('tts.pitch')}</label>
              <span className="text-xs text-purple-300">{pitch.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={pitch}
              onChange={(e) => setPitch(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider-thumb"
            />
          </div>

          {/* Test Voice Button */}
          <button
            onClick={handleTestVoice}
            className={`w-full px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
              isSpeaking
                ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white'
                : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
            }`}
            disabled={!isEnabled}
          >
            {isSpeaking ? (
              <>
                <span className="mr-2">⏹️</span>
                {t('tts.stopSpeaking')}
              </>
            ) : (
              <>
                <span className="mr-2">🎵</span>
                {t('tts.testVoice')}
              </>
            )}
          </button>

          {/* Speaking Indicator */}
          {isSpeaking && (
            <div className="flex items-center justify-center p-2 bg-purple-900/30 rounded-lg border border-purple-400/30">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse delay-75"></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse delay-150"></div>
                </div>
                <span className="text-purple-200 text-sm">{t('tts.aiSpeaking')}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TTSControls; 