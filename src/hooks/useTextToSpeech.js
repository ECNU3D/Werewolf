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
  const [currentSpeechType, setCurrentSpeechType] = useState(null); // 'ai', 'system', 'user'
  const synthRef = useRef(null);
  const { currentLanguage } = useLanguage();

  // Initialize speech synthesis
  useEffect(() => {
    const initializeSpeechSynthesis = () => {
      try {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis) {
          synthRef.current = window.speechSynthesis;
          
          // Test if speech synthesis is actually functional
          const testUtterance = new SpeechSynthesisUtterance('');
          testUtterance.volume = 0;
          testUtterance.rate = 10;
          
          // Add error handler for test utterance
          testUtterance.onerror = (error) => {
            console.warn('TTS test failed:', error);
            setIsAvailable(false);
          };
          
          testUtterance.onend = () => {
            setIsAvailable(true);
          };
          
          // Try to speak the test utterance
          synthRef.current.speak(testUtterance);
          
          // Fallback - if test doesn't complete in 1 second, assume it works
          setTimeout(() => {
            if (synthRef.current) {
              setIsAvailable(true);
            }
          }, 1000);
          
        } else {
          console.warn('Speech synthesis not supported');
          setIsAvailable(false);
        }
      } catch (error) {
        console.error('Error initializing speech synthesis:', error);
        setIsAvailable(false);
      }
    };

    initializeSpeechSynthesis();
    
    // Clear any existing speech when component unmounts
    return () => {
      try {
        if (synthRef.current) {
          synthRef.current.cancel();
        }
      } catch (error) {
        console.error('Error cleaning up speech synthesis:', error);
      }
    };
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

  // Wait for voices to be loaded
  const waitForVoices = useCallback(() => {
    return new Promise((resolve) => {
      const voices = synthRef.current?.getVoices() || [];
      if (voices.length > 0) {
        resolve(voices);
      } else {
        // Wait for voices to load
        const handleVoicesChanged = () => {
          const newVoices = synthRef.current?.getVoices() || [];
          if (newVoices.length > 0) {
            synthRef.current?.removeEventListener('voiceschanged', handleVoicesChanged);
            resolve(newVoices);
          }
        };
        
        synthRef.current?.addEventListener('voiceschanged', handleVoicesChanged);
        
        // Fallback timeout
        setTimeout(() => {
          synthRef.current?.removeEventListener('voiceschanged', handleVoicesChanged);
          resolve(synthRef.current?.getVoices() || []);
        }, 3000);
      }
    });
  }, []);

  // Speak text with TTS
  const speak = useCallback((text, options = {}) => {
    if (!isEnabled || !isAvailable || !synthRef.current || !text.trim()) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      try {
        // Cancel any ongoing speech and wait a moment for cleanup
        if (synthRef.current && synthRef.current.speaking) {
          synthRef.current.cancel();
          // Small delay to ensure previous speech is properly cancelled
          setTimeout(() => {
            startNewUtterance();
          }, 100);
        } else {
          startNewUtterance();
        }
      } catch (error) {
        console.error('Error in speak function:', error);
        setIsSpeaking(false);
        setCurrentSpeechType(null);
        resolve();
      }

      async function startNewUtterance() {
        try {
          // Wait for voices to be available
          await waitForVoices();
          
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
            setCurrentSpeechType(options.speechType || 'system');
          };

          utterance.onend = () => {
            setIsSpeaking(false);
            setCurrentSpeechType(null);
            resolve();
          };

          utterance.onerror = (error) => {
            setIsSpeaking(false);
            setCurrentSpeechType(null);
            
            // Better error logging
            const errorDetails = {
              type: error.type,
              error: error.error,
              message: error.message,
              timestamp: new Date().toISOString()
            };
            
            // Don't reject promise for interruption - it's expected behavior
            if (error.error === 'interrupted') {
              console.debug('TTS interrupted (expected behavior):', errorDetails);
              resolve(); // Resolve instead of reject for interruptions
            } else {
              console.error('TTS Error Details:', errorDetails);
              console.error('Raw error event:', error);
              // Resolve instead of reject to prevent unhandled promise rejections
              resolve();
            }
          };

          // Speak the text
          if (synthRef.current && !synthRef.current.speaking) {
            synthRef.current.speak(utterance);
          } else {
            console.warn('SpeechSynthesis is already speaking or unavailable');
            resolve();
          }
        } catch (error) {
          console.error('Error in startNewUtterance:', error);
          setIsSpeaking(false);
          setCurrentSpeechType(null);
          resolve();
        }
      }
    });
  }, [isEnabled, isAvailable, volume, rate, pitch, currentLanguage, getVoices, waitForVoices]);

  // Stop current speech
  const stop = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
      setCurrentSpeechType(null);
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
      speechType: 'ai'
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
  const speakSystemMessage = useCallback((message, options = {}) => {
    if (!message) return Promise.resolve();
    
    // Use appropriate voice settings for system messages
    const systemOptions = {
      volume: options.volume !== undefined ? options.volume : volume * 0.8,
      rate: options.rate !== undefined ? options.rate : rate * 0.9,
      pitch: options.pitch !== undefined ? options.pitch : pitch * 0.8,
      speechType: 'system'
    };
    
    return speak(message, systemOptions);
  }, [speak, volume, rate, pitch]);

  return {
    // State
    isEnabled,
    isAvailable,
    isSpeaking,
    currentSpeechType,
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