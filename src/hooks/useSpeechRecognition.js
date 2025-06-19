import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { LANGUAGES } from '../constants/languages';

export const useSpeechRecognition = (humanPlayerId, addLog) => {
  const [isListening, setIsListening] = useState(false);
  const [humanPlayerSpeech, setHumanPlayerSpeech] = useState('');
  const recognitionRef = useRef(null);
  const { currentLanguage, t } = useLanguage();

  useEffect(() => { 
    let recognitionInstance;
    if (typeof window !== 'undefined' && (typeof window.SpeechRecognition !== 'undefined' || typeof window.webkitSpeechRecognition !== 'undefined')) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      
      // Set language based on current language
      recognitionInstance.lang = currentLanguage === LANGUAGES.CHINESE ? 'zh-CN' : 'en-US';
      
      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setHumanPlayerSpeech(transcript);
        addLog(t('speech.yourSpeech', { id: humanPlayerId, text: transcript }), 'human', true);
        setIsListening(false);
      };
      
      recognitionInstance.onerror = (event) => {
        let errorMessage = t('speech.speechError', { error: event.error || 'Unknown error' });
        console.error('Speech recognition error:', event.error || event); 
        addLog(`${errorMessage}. ${t('speech.checkMicrophone')}`, 'error', true);
        setIsListening(false);
      };
      
      recognitionInstance.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current = recognitionInstance;
    } else {
      addLog(t('speech.noSpeechSupport'), 'system', true);
    }
    
    return () => {
      if (recognitionInstance) {
        recognitionInstance.onresult = null;
        recognitionInstance.onerror = null;
        recognitionInstance.onend = null;
        recognitionInstance.stop(); 
        recognitionInstance = null;
      }
    };
  }, [humanPlayerId, addLog, currentLanguage, t]); 

  const toggleListen = () => {
    if (!recognitionRef.current) {
        addLog(t('speech.speechError', { error: 'Not ready' }), 'error', true);
        return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setHumanPlayerSpeech(''); 
      try {
        recognitionRef.current.start();
        setIsListening(true);
        addLog(t('speech.startSpeaking'), 'system', true);
      } catch (e) {
        console.error("Error starting speech recognition: ", e);
        addLog(t('speech.speechError', { error: e.message || 'Failed to start' }) + '. ' + t('speech.checkMicrophone'), 'error', true);
        setIsListening(false);
      }
    }
  };

  return {
    isListening,
    humanPlayerSpeech,
    setHumanPlayerSpeech,
    toggleListen
  };
}; 