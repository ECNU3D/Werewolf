import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const LanguageSelection = ({ onLanguageSelected }) => {
  const { availableLanguages, languageNames, switchLanguage } = useLanguage();

  const handleLanguageSelect = (language) => {
    switchLanguage(language);
    if (onLanguageSelected) {
      onLanguageSelected(language);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-10 w-4 h-4 bg-purple-400/30 rounded-full animate-pulse"></div>
        <div className="absolute top-20 right-20 w-2 h-2 bg-blue-400/40 rounded-full animate-pulse animation-delay-500"></div>
        <div className="absolute bottom-20 left-20 w-3 h-3 bg-purple-300/20 rounded-full animate-pulse animation-delay-1000"></div>
        <div className="absolute bottom-10 right-10 w-5 h-5 bg-blue-300/20 rounded-full animate-pulse animation-delay-1500"></div>
      </div>

      <div className="relative z-10 text-center max-w-4xl w-full">
        {/* Welcome message */}
        <div className="mb-8">
          <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-300 via-blue-300 to-purple-300 bg-clip-text text-transparent tracking-wider">
            狼人杀 / Werewolf
          </h1>
          <div className="flex items-center justify-center text-xl text-gray-300 mb-4">
            <span className="mr-2">🌙</span>
            <span>经典推理游戏 / Classic Deduction Game</span>
            <span className="ml-2">🐺</span>
          </div>
        </div>

        {/* Language selection */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-6 text-blue-300">
            选择语言 / Choose Language
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {Object.values(availableLanguages).map((language) => (
              <button
                key={language}
                onClick={() => handleLanguageSelect(language)}
                className="group relative p-8 bg-gradient-to-br from-gray-800/50 to-blue-900/50 rounded-2xl border-2 border-gray-600 hover:border-blue-400 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-400/50 backdrop-filter backdrop-blur-sm"
              >
                {/* Language flag/icon */}
                <div className="text-6xl mb-4">
                  {language === availableLanguages.CHINESE ? '🇨🇳' : '🇺🇸'}
                </div>
                
                {/* Language name */}
                <h3 className="text-2xl font-bold mb-2 group-hover:text-blue-300 transition-colors">
                  {languageNames[language]}
                </h3>
                
                {/* Sample text */}
                <p className="text-gray-300 text-lg">
                  {language === availableLanguages.CHINESE 
                    ? '开始游戏' 
                    : 'Start Game'
                  }
                </p>

                {/* Hover effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-purple-600/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </button>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="p-6 bg-gray-900/50 rounded-xl border border-gray-700/50 max-w-3xl mx-auto">
          <p className="text-gray-400 leading-relaxed">
            <span className="text-blue-300">🎯 中文:</span> 选择您偏好的语言来享受游戏体验
            <br />
            <span className="text-blue-300">🎯 English:</span> Select your preferred language to enjoy the game experience
          </p>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-4 right-4 w-24 h-24 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full pointer-events-none"></div>
      <div className="absolute bottom-4 left-4 w-20 h-20 bg-gradient-to-tr from-blue-500/10 to-transparent rounded-full pointer-events-none"></div>
    </div>
  );
};

export default LanguageSelection; 