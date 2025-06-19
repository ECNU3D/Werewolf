import { useState, useEffect, useRef } from 'react';

export const useSpeechRecognition = (humanPlayerId, addLog) => {
  const [isListening, setIsListening] = useState(false);
  const [humanPlayerSpeech, setHumanPlayerSpeech] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => { 
    let recognitionInstance;
    if (typeof window !== 'undefined' && (typeof window.SpeechRecognition !== 'undefined' || typeof window.webkitSpeechRecognition !== 'undefined')) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'zh-CN';
      
      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setHumanPlayerSpeech(transcript);
        addLog(`你 (玩家 ${humanPlayerId}) 说: ${transcript}`, 'human', true);
        setIsListening(false);
      };
      
      recognitionInstance.onerror = (event) => {
        let errorMessage = '未知语音识别错误';
        if (event.error) {
          errorMessage = `语音识别错误: ${event.error}`;
          console.error('Detailed speech recognition error:', event.error); 
        } else {
          console.error('Generic speech recognition error object:', event); 
        }
        addLog(`${errorMessage}. 请尝试手动输入或检查麦克风权限。`, 'error', true);
        setIsListening(false);
      };
      
      recognitionInstance.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current = recognitionInstance;
    } else {
      addLog('您的浏览器不支持语音识别。请手动输入发言。', 'system', true);
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
  }, [humanPlayerId, addLog]); 

  const toggleListen = () => {
    if (!recognitionRef.current) {
        addLog('语音识别功能尚未准备好。', 'error', true);
        return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setHumanPlayerSpeech(''); 
      try {
        recognitionRef.current.start();
        setIsListening(true);
        addLog('请开始发言...', 'system', true);
      } catch (e) {
        console.error("Error starting speech recognition: ", e);
        addLog(`启动语音识别失败: ${e.message}. 请检查麦克风设置。`, 'error', true);
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