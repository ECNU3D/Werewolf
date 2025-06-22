import { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { LANGUAGES } from '../constants/languages';

export const useTextToSpeech = () => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [volume, setVolume] = useState(0.7);
  const [rate, setRate] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const synthRef = useRef(null);
  const { currentLanguage } = useLanguage();

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
      setIsAvailable(true);
      
      // Clear any existing speech when component unmounts
      return () => {
        if (synthRef.current) {
          synthRef.current.cancel();
        }
      };
    } else {
      setIsAvailable(false);
    }
  }, []);

  // Get available voices for current language
  const getVoices = useCallback(() => {
    if (!synthRef.current) return [];
    
    const voices = synthRef.current.getVoices();
    const languageCode = currentLanguage === LANGUAGES.CHINESE ? 'zh' : 'en';
    
    // Filter voices by language
    const languageVoices = voices.filter(voice => 
      voice.lang.toLowerCase().startsWith(languageCode.toLowerCase())
    );
    
    return languageVoices.length > 0 ? languageVoices : voices;
  }, [currentLanguage]);

  // Speak text with TTS
  const speak = useCallback((text, options = {}) => {
    if (!isEnabled || !isAvailable || !synthRef.current || !text.trim()) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      // Cancel any ongoing speech and wait a moment for cleanup
      if (synthRef.current.speaking) {
        synthRef.current.cancel();
        // Small delay to ensure previous speech is properly cancelled
        setTimeout(() => {
          startNewUtterance();
        }, 100);
      } else {
        startNewUtterance();
      }

      function startNewUtterance() {
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Set voice based on language preference
        const voices = getVoices();
        if (voices.length > 0) {
          // Prefer higher quality voices (usually local voices)
          const preferredVoice = voices.find(voice => voice.localService) || voices[0];
          utterance.voice = preferredVoice;
        }

        // Set speech parameters
        utterance.volume = options.volume !== undefined ? options.volume : volume;
        utterance.rate = options.rate !== undefined ? options.rate : rate;
        utterance.pitch = options.pitch !== undefined ? options.pitch : pitch;
        
        // Set language
        utterance.lang = currentLanguage === LANGUAGES.CHINESE ? 'zh-CN' : 'en-US';

        // Event handlers
        utterance.onstart = () => {
          setIsSpeaking(true);
        };

        utterance.onend = () => {
          setIsSpeaking(false);
          resolve();
        };

        utterance.onerror = (error) => {
          setIsSpeaking(false);
          // Don't reject promise for interruption - it's expected behavior
          if (error.error === 'interrupted') {
            console.debug('TTS interrupted (expected behavior):', error);
            resolve(); // Resolve instead of reject for interruptions
          } else {
            console.error('TTS Error:', error);
            reject(error);
          }
        };

        // Speak the text
        synthRef.current.speak(utterance);
      }
    });
  }, [isEnabled, isAvailable, volume, rate, pitch, currentLanguage, getVoices]);

  // Stop current speech
  const stop = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  }, []);

  // Speak AI player statement with appropriate formatting
  const speakAIStatement = useCallback((playerId, statement, role = null) => {
    if (!statement) return Promise.resolve();

    // Format the speech text
    let speechText = '';
    if (currentLanguage === LANGUAGES.CHINESE) {
      speechText = `玩家${playerId}说：${statement}`;
    } else {
      speechText = `Player ${playerId} says: ${statement}`;
    }

    // Adjust speech rate based on length (longer statements speak faster)
    const baseRate = rate;
    const lengthAdjustment = Math.min(statement.length / 100, 0.3); // Max 30% speed increase
    const adjustedRate = baseRate + lengthAdjustment;

    const speechOptions = {
      volume: volume,
      rate: role ? adjustedRate * (0.9 + Math.random() * 0.2) : adjustedRate, // Slight variation for roles
      pitch: role ? pitch * (0.8 + Math.random() * 0.4) : pitch, // Voice variation for roles
    };

    // Add timeout to prevent hanging
    return Promise.race([
      speak(speechText, speechOptions),
      new Promise((resolve) => {
        setTimeout(() => {
          console.debug('TTS timeout reached, continuing game');
          resolve();
        }, Math.max(15000, statement.length * 100)); // At least 15s, or 100ms per character
      })
    ]);
  }, [speak, volume, rate, pitch, currentLanguage]);

  // Speak system announcements
  const speakSystemMessage = useCallback((message) => {
    if (!message) return Promise.resolve();
    
    // Use a slightly different voice for system messages
    const systemOptions = {
      volume: volume * 0.8,
      rate: rate * 0.9,
      pitch: pitch * 0.8,
    };
    
    return speak(message, systemOptions);
  }, [speak, volume, rate, pitch]);

  return {
    // State
    isEnabled,
    isAvailable,
    isSpeaking,
    volume,
    rate,
    pitch,
    
    // Controls
    setIsEnabled,
    setVolume,
    setRate,
    setPitch,
    
    // Functions
    speak,
    stop,
    speakAIStatement,
    speakSystemMessage,
    getVoices,
  };
}; 