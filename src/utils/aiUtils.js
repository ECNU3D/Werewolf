import { ROLES } from '../constants/gameConstants';
import { LANGUAGES, translations } from '../constants/languages';

// Check if we're in production mode (served by nginx proxy)
const isProduction = process.env.NODE_ENV === 'production';

// AI Provider Configuration
const getAIConfig = () => {
  const provider = process.env.REACT_APP_AI_PROVIDER || 'gemini'; // Default to gemini
  const config = {
    provider: provider.toLowerCase(),
  };

  if (isProduction) {
    // In production, use nginx proxy endpoints
    config.useProxy = true;
    // Use provider-specific model configuration
    if (config.provider === 'ollama') {
      config.model = process.env.REACT_APP_OLLAMA_MODEL || 'gemma3:4b';
    } else if (config.provider === 'gemini') {
      config.model = process.env.REACT_APP_GEMINI_MODEL || 'gemini-2.5-flash';
    } else if (config.provider === 'openai') {
      config.model = process.env.REACT_APP_OPENAI_MODEL || 'gpt-4o-mini';
    }
  } else {
    // In development, use direct API calls
    config.useProxy = false;
    if (config.provider === 'ollama') {
      config.baseUrl = process.env.REACT_APP_OLLAMA_BASE_URL || 'http://localhost:11434';
      config.model = process.env.REACT_APP_OLLAMA_MODEL || 'gemma3:4b'; // Default model
    } else if (config.provider === 'gemini') {
      config.apiKey = process.env.REACT_APP_GEMINI_API_KEY;
      config.model = process.env.REACT_APP_GEMINI_MODEL || 'gemini-2.5-flash'; // Default model
    } else if (config.provider === 'openai') {
      config.baseUrl = process.env.REACT_APP_OPENAI_BASE_URL || 'https://api.openai.com/v1';
      config.apiKey = process.env.REACT_APP_OPENAI_API_KEY;
      config.model = process.env.REACT_APP_OPENAI_MODEL || 'gpt-4o-mini'; // Default model
    }
  }

  return config;
};

// Ollama API call function
const callOllamaAPI = async (prompt, config, aiPlayer, promptPurpose, addLog) => {
  let apiUrl, payload, headers;

  if (config.useProxy) {
    // Use nginx proxy endpoint
    apiUrl = '/api/ollama/generate';
    payload = {
      model: config.model,
      prompt: prompt,
      stream: false,
      options: {
        temperature: 0.7,
        top_p: 0.9,
        // stop: ["\n", "Player", "---"]
      }
    };
    headers = { 'Content-Type': 'application/json' };
  } else {
    // Direct API call for development
    apiUrl = `${config.baseUrl}/api/generate`;
    payload = {
      model: config.model,
      prompt: prompt,
      stream: false,
      options: {
        temperature: 0.7,
        top_p: 0.9,
        // stop: ["\n", "Player", "---"]
      }
    };
    headers = { 'Content-Type': 'application/json' };
  }

  console.debug(`[OLLAMA_REQUEST] AI Player ${aiPlayer.id} (${promptPurpose}) | Model: ${config.model} | URL: ${apiUrl}`);

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[OLLAMA_ERROR] AI ${aiPlayer.id} (${promptPurpose}) | Status: ${response.status} | Error: ${errorBody}`);
      
      if (response.status === 404) {
        addLog(`🤖 AI ${aiPlayer.id} - Ollama model '${config.model}' not found. Please pull the model first: ollama pull ${config.model}`, 'error', true);
      } else if (response.status === 500) {
        addLog(`🔧 AI ${aiPlayer.id} - Ollama server error. Check if Ollama is running${config.useProxy ? ' on the backend' : ` on ${config.baseUrl}`}`, 'error', true);
      } else {
        addLog(`🚫 AI ${aiPlayer.id} - Ollama API Error (${response.status}): Check console for details.`, 'error', true);
      }
      return null;
    }

    const result = await response.json();
    console.debug(`[OLLAMA_RAW_RESPONSE] AI Player ${aiPlayer.id} (${promptPurpose}):\n${JSON.stringify(result, null, 2)}`);

    if (result.response) {
      let text = result.response.trim();
      console.debug(`[OLLAMA_EXTRACTED_TEXT] AI Player ${aiPlayer.id} (${promptPurpose}): "${text}"`);
      return text;
    } else {
      console.error(`[OLLAMA_ERROR] AI ${aiPlayer.id} (${promptPurpose}) No response in result:`, result);
      addLog(`AI ${aiPlayer.id} (${promptPurpose}) Unexpected Ollama response structure.`, 'error', true);
      return null;
    }
  } catch (error) {
    console.error(`[OLLAMA_CATCH_ERROR] Error calling Ollama API (AI ${aiPlayer.id}, ${promptPurpose}):`, error);
    if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
      addLog(`🌐 AI ${aiPlayer.id} - Network error: Unable to connect to Ollama${config.useProxy ? ' backend' : ` at ${config.baseUrl}`}. Check if Ollama is running.`, 'error', true);
    } else {
      addLog(`AI ${aiPlayer.id} (${promptPurpose}) Ollama error: ${error.message}`, 'error', true);
    }
    return null;
  }
};

// Gemini API call function
const callGeminiAPI = async (prompt, config, aiPlayer, promptPurpose, addLog) => {
  let apiUrl, payload, headers;

  if (config.useProxy) {
    // Use nginx proxy endpoint
    apiUrl = '/api/gemini/generate';
    payload = {
      model: config.model,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { stopSequences: ["\n"] }
    };
    headers = { 'Content-Type': 'application/json' };
  } else {
    // Direct API call for development
    if (!config.apiKey || config.apiKey.trim() === '') {
      console.error("[GEMINI_ERROR] Gemini API key is not configured. Please set REACT_APP_GEMINI_API_KEY in your .env file.");
      addLog(`AI ${aiPlayer.id} (${promptPurpose}) Gemini API key not configured. Please check environment variables.`, 'error', true);
      return null;
    }

    apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`;
    payload = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { stopSequences: ["\n"] }
    };
    headers = { 'Content-Type': 'application/json' };
  }

  console.debug(`[GEMINI_REQUEST] AI Player ${aiPlayer.id} (${promptPurpose}) | Model: ${config.model}`);

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorBody = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorBody);
      } catch (e) {
        errorData = { error: { message: errorBody } };
      }
      
      console.error(`[GEMINI_ERROR] AI ${aiPlayer.id} (${promptPurpose}) | Status: ${response.status} | Error: ${errorBody}`);
      
      // Handle specific error types
      if (errorData.error && errorData.error.message) {
        const errorMessage = errorData.error.message;
        if (errorMessage.includes("User location is not supported")) {
          addLog(`🌍 AI ${aiPlayer.id} - Geographic restriction: Gemini API is not available in your region. Consider using Ollama instead.`, 'error', true);
        } else if (errorMessage.includes("API key")) {
          addLog(`🔑 AI ${aiPlayer.id} - API Key error: ${errorMessage}`, 'error', true);
        } else if (errorMessage.includes("quota") || errorMessage.includes("limit")) {
          addLog(`📊 AI ${aiPlayer.id} - Rate limit reached. Please wait and try again.`, 'error', true);
        } else {
          addLog(`🚫 AI ${aiPlayer.id} - Gemini API Error: ${errorMessage}`, 'error', true);
        }
      } else {
        addLog(`AI ${aiPlayer.id} (${promptPurpose}) Gemini API request failed: ${response.status}. Check console for details.`, 'error', true);
      }
      return null;
    }

    const result = await response.json();
    console.debug(`[GEMINI_RAW_RESPONSE] AI Player ${aiPlayer.id} (${promptPurpose}):\n${JSON.stringify(result, null, 2)}`);

    if (result.candidates && result.candidates.length > 0 &&
        result.candidates[0].content && result.candidates[0].content.parts &&
        result.candidates[0].content.parts.length > 0) {
      let text = result.candidates[0].content.parts[0].text.trim();
      console.debug(`[GEMINI_EXTRACTED_TEXT] AI Player ${aiPlayer.id} (${promptPurpose}): "${text}"`);
      return text;
    } else {
      console.error(`[GEMINI_ERROR] AI ${aiPlayer.id} (${promptPurpose}) Unexpected API response structure:`, result);
      addLog(`AI ${aiPlayer.id} (${promptPurpose}) Unexpected Gemini response structure. Check console for details.`, 'error', true);
      if (result.promptFeedback && result.promptFeedback.blockReason) {
          addLog(`AI ${aiPlayer.id} Prompt blocked: ${result.promptFeedback.blockReason}`, 'error', true);
          console.error(`[GEMINI_PROMPT_FEEDBACK] AI ${aiPlayer.id} Prompt blocked: ${result.promptFeedback.blockReason} | Details: ${JSON.stringify(result.promptFeedback.safetyRatings)}`);
      }
      return null; 
    }
  } catch (error) {
    console.error(`[GEMINI_CATCH_ERROR] Error calling Gemini API (AI ${aiPlayer.id}, ${promptPurpose}):`, error);
    if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
      addLog(`🌐 AI ${aiPlayer.id} - Network error: Unable to connect to Gemini API. Check your internet connection.`, 'error', true);
    } else {
      addLog(`AI ${aiPlayer.id} (${promptPurpose}) Gemini thinking error: ${error.message}`, 'error', true);
    }
    return null;
  }
};

// OpenAI compatible API call function
const callOpenAIAPI = async (prompt, config, aiPlayer, promptPurpose, addLog) => {
  let apiUrl, payload, headers;

  if (config.useProxy) {
    // Use nginx proxy endpoint
    apiUrl = '/api/openai/chat/completions';
    payload = {
      model: config.model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 500,
      // stop: ["\n", "Player", "---"]
    };
    headers = { 'Content-Type': 'application/json' };
  } else {
    // Direct API call for development
    if (!config.apiKey || config.apiKey.trim() === '') {
      console.error("[OPENAI_ERROR] OpenAI API key is not configured. Please set REACT_APP_OPENAI_API_KEY in your .env file.");
      addLog(`AI ${aiPlayer.id} (${promptPurpose}) OpenAI API key not configured. Please check environment variables.`, 'error', true);
      return null;
    }

    apiUrl = `${config.baseUrl}/chat/completions`;
    payload = {
      model: config.model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 500,
      // stop: ["\n", "Player", "---"]
    };
    headers = { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    };
  }

  console.debug(`[OPENAI_REQUEST] AI Player ${aiPlayer.id} (${promptPurpose}) | Model: ${config.model} | URL: ${apiUrl}`);

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorBody = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorBody);
      } catch (e) {
        errorData = { error: { message: errorBody } };
      }
      
      console.error(`[OPENAI_ERROR] AI ${aiPlayer.id} (${promptPurpose}) | Status: ${response.status} | Error: ${errorBody}`);
      
      // Handle specific error types
      if (errorData.error && errorData.error.message) {
        const errorMessage = errorData.error.message;
        if (errorMessage.includes("Incorrect API key")) {
          addLog(`🔑 AI ${aiPlayer.id} - Invalid API key. Please check your OpenAI API key.`, 'error', true);
        } else if (errorMessage.includes("quota") || errorMessage.includes("billing")) {
          addLog(`💳 AI ${aiPlayer.id} - Quota exceeded. Please check your OpenAI billing and usage.`, 'error', true);
        } else if (errorMessage.includes("rate limit")) {
          addLog(`⏱️ AI ${aiPlayer.id} - Rate limit reached. Please wait and try again.`, 'error', true);
        } else if (errorMessage.includes("model")) {
          addLog(`🤖 AI ${aiPlayer.id} - Model '${config.model}' not available. Please check available models.`, 'error', true);
        } else {
          addLog(`🚫 AI ${aiPlayer.id} - OpenAI API Error: ${errorMessage}`, 'error', true);
        }
      } else {
        addLog(`AI ${aiPlayer.id} (${promptPurpose}) OpenAI API request failed: ${response.status}. Check console for details.`, 'error', true);
      }
      return null;
    }

    const result = await response.json();
    console.debug(`[OPENAI_RAW_RESPONSE] AI Player ${aiPlayer.id} (${promptPurpose}):\n${JSON.stringify(result, null, 2)}`);

    if (result.choices && result.choices.length > 0 && result.choices[0].message && result.choices[0].message.content) {
      let text = result.choices[0].message.content.trim();
      console.debug(`[OPENAI_EXTRACTED_TEXT] AI Player ${aiPlayer.id} (${promptPurpose}): "${text}"`);
      return text;
    } else {
      console.error(`[OPENAI_ERROR] AI ${aiPlayer.id} (${promptPurpose}) Unexpected API response structure:`, result);
      addLog(`AI ${aiPlayer.id} (${promptPurpose}) Unexpected OpenAI response structure. Check console for details.`, 'error', true);
      return null;
    }
  } catch (error) {
    console.error(`[OPENAI_CATCH_ERROR] Error calling OpenAI API (AI ${aiPlayer.id}, ${promptPurpose}):`, error);
    if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
      addLog(`🌐 AI ${aiPlayer.id} - Network error: Unable to connect to OpenAI API${config.useProxy ? ' backend' : ` at ${config.baseUrl}`}. Check your internet connection.`, 'error', true);
    } else {
      addLog(`AI ${aiPlayer.id} (${promptPurpose}) OpenAI thinking error: ${error.message}`, 'error', true);
    }
    return null;
  }
};

export const getAIDecision = async (aiPlayer, promptPurpose, currentHistory_param, gameState, currentLanguage = LANGUAGES.CHINESE) => {
  const { 
    players, 
    seerLastCheck, 
    guardLastProtectedId, 
    werewolfTargetId, 
    witchPotions, 
    humanPlayerId, 
    addLog 
  } = gameState;

  // Get translations for current language
  const t = translations[currentLanguage];
  const tr = (role) => t?.roles?.[role] || role;

  // Get AI configuration
  const config = getAIConfig();
  console.debug(`[AI_CONFIG] Using provider: ${config.provider}, model: ${config.model}`);

  console.debug(`[AI_DECISION_START] AI Player ${aiPlayer.id} (${aiPlayer.role}) | Task: ${promptPurpose} | Provider: ${config.provider}`);
  
  // Add explicit language instruction
  const languageInstruction = currentLanguage === LANGUAGES.CHINESE 
    ? "重要：请用中文回答。请不要使用英文回答。"
    : "IMPORTANT: Please respond in English only. Do not use Chinese characters.";
  
  let basePrompt = `${languageInstruction}\n\n${aiPlayer.aiSystemPrompt}\n`;
  
  // Include ALL game history visible to this AI role, not just the last 20 entries
  basePrompt += `${t.aiPrompts.gameHistory}\n${currentHistory_param.map(log => {
    const speaker = log.type === 'human' ? t.aiPrompts.speakers.player.replace('{{playerId}}', humanPlayerId) : 
                   (log.type === 'ai' ? t.aiPrompts.speakers.player.replace('{{playerId}}', aiPlayer.id) : 
                   t.aiPrompts.speakers.system);
    return t.aiPrompts.historyEntry.replace('{{timestamp}}', log.timestamp).replace('{{speaker}}', speaker).replace('{{text}}', log.text);
  }).join('\n')}\n---\n`;
  
  const alivePlayerObjects = players.filter(p => p.isAlive);
  let alivePlayerInfo = `${t.aiPrompts.playerInfo.currentAlivePlayers}\n`;
  alivePlayerObjects.forEach(p => {
      let roleDisplay = t.aiPrompts.playerInfo.unknownRole;
      if (p.id === aiPlayer.id) {
          roleDisplay = tr(p.role); 
      } else if (aiPlayer.role === ROLES.WEREWOLF && p.role === ROLES.WEREWOLF) {
          roleDisplay = t.aiPrompts.playerInfo.yourTeammateWerewolf.replace('{{role}}', tr(ROLES.WEREWOLF)); 
      } else if (aiPlayer.role === ROLES.SEER && seerLastCheck && seerLastCheck.targetId === p.id) {
          roleDisplay = tr(seerLastCheck.targetRole); 
      } else if (p.revealedRole) {
          roleDisplay = tr(p.revealedRole);
      }
      alivePlayerInfo += t.aiPrompts.playerInfo.playerEntry
        .replace('{{playerId}}', p.id)
        .replace('{{playerType}}', p.isHuman ? t.aiPrompts.playerInfo.human : t.aiPrompts.playerInfo.ai)
        .replace('{{roleDisplay}}', roleDisplay) + '\n';
  });
  basePrompt += alivePlayerInfo;
  
  if (aiPlayer.role === ROLES.WEREWOLF) {
      const otherWolves = players.filter(p => p.role === ROLES.WEREWOLF && p.id !== aiPlayer.id && p.isAlive);
      if (otherWolves.length > 0) {
          basePrompt += t.aiPrompts.playerInfo.werewolfTeammates.replace('{{teammates}}', otherWolves.map(w => `${t.common.player} ${w.id}`).join(', ')) + '\n';
      } else {
          basePrompt += `${t.aiPrompts.playerInfo.onlyWerewolfLeft}\n`;
      }
  }
  basePrompt += t.aiPrompts.playerInfo.yourInfo.replace('{{playerId}}', aiPlayer.id).replace('{{role}}', tr(aiPlayer.role)) + '\n';

  let specificQuestion = "";
  let expectedFormat = "";

  switch (promptPurpose) {
    case 'WEREWOLF_TARGET':
      specificQuestion = t.aiPrompts.tasks.werewolfTarget.question;
      expectedFormat = t.aiPrompts.tasks.werewolfTarget.format;
      break;
    case 'GUARD_PROTECT':
      const lastProtected = guardLastProtectedId === null ? t.aiPrompts.tasks.guardProtect.noOne : `${t.common.player} ${guardLastProtectedId}`;
      specificQuestion = t.aiPrompts.tasks.guardProtect.question.replace('{{lastProtected}}', lastProtected);
      expectedFormat = t.aiPrompts.tasks.guardProtect.format;
      break;
    case 'SEER_CHECK':
      specificQuestion = t.aiPrompts.tasks.seerCheck.question;
      expectedFormat = t.aiPrompts.tasks.seerCheck.format;
      break;
    case 'WITCH_SAVE_CHOICE': 
      const wolfVictim = players.find(p => p.id === werewolfTargetId);
      const antidoteStatus = witchPotions.antidote ? t.aiPrompts.tasks.witchSaveChoice.antidoteNotUsed : t.aiPrompts.tasks.witchSaveChoice.antidoteUsed;
      specificQuestion = t.aiPrompts.tasks.witchSaveChoice.question
        .replace('{{targetId}}', werewolfTargetId)
        .replace('{{targetRole}}', tr(wolfVictim?.role) || t.aiPrompts.playerInfo.unknownRole)
        .replace('{{antidoteStatus}}', antidoteStatus);
      expectedFormat = t.aiPrompts.tasks.witchSaveChoice.format;
      break;
    case 'WITCH_POISON_CHOICE': 
      const poisonStatus = witchPotions.poison ? t.aiPrompts.tasks.witchPoisonChoice.poisonNotUsed : t.aiPrompts.tasks.witchPoisonChoice.poisonUsed;
      specificQuestion = t.aiPrompts.tasks.witchPoisonChoice.question.replace('{{poisonStatus}}', poisonStatus);
      expectedFormat = t.aiPrompts.tasks.witchPoisonChoice.format;
      break;
    case 'HUNTER_SHOOT':
      specificQuestion = t.aiPrompts.tasks.hunterShoot.question.replace('{{playerId}}', aiPlayer.id);
      expectedFormat = t.aiPrompts.tasks.hunterShoot.format;
      break;
    case 'DISCUSSION_STATEMENT':
      specificQuestion = t.aiPrompts.tasks.discussionStatement.question
        .replace('{{playerId}}', aiPlayer.id)
        .replace('{{role}}', tr(aiPlayer.role));
      expectedFormat = t.aiPrompts.tasks.discussionStatement.format;
      break;
    case 'VOTE_PLAYER':
      specificQuestion = t.aiPrompts.tasks.votePlayer.question
        .replace('{{playerId}}', aiPlayer.id)
        .replace('{{role}}', tr(aiPlayer.role));
      expectedFormat = t.aiPrompts.tasks.votePlayer.format;
      break;
    default:
      addLog(`AI ${aiPlayer.id} received unknown action type: ${promptPurpose}`, 'error', true);
      console.error(`[AI ERROR] AI ${aiPlayer.id} received unknown action type: ${promptPurpose}`);
      return null;
  }

  // Add final language reminder before the task
  const finalLanguageReminder = currentLanguage === LANGUAGES.CHINESE 
    ? "\n重要提醒：请务必用中文回答，不要使用英文。"
    : "\nIMPORTANT REMINDER: You must respond in English only. Do not use any Chinese characters.";

  const fullPrompt = `${basePrompt}\n${t.aiPrompts.yourTask}\n${specificQuestion}\n${expectedFormat}${finalLanguageReminder}`;
  console.debug(`[AI_PROMPT_SENT] AI Player ${aiPlayer.id} (${aiPlayer.role}) | Task: ${promptPurpose} | Provider: ${config.provider}\nPrompt content:\n${fullPrompt}`);
  
  // Route to appropriate AI provider
  let rawResponse;
  if (config.provider === 'ollama') {
    rawResponse = await callOllamaAPI(fullPrompt, config, aiPlayer, promptPurpose, addLog);
  } else if (config.provider === 'gemini') {
    rawResponse = await callGeminiAPI(fullPrompt, config, aiPlayer, promptPurpose, addLog);
  } else if (config.provider === 'openai') {
    rawResponse = await callOpenAIAPI(fullPrompt, config, aiPlayer, promptPurpose, addLog);
  } else {
    console.error(`[AI_ERROR] Unknown AI provider: ${config.provider}`);
    addLog(`AI ${aiPlayer.id} - Unknown AI provider: ${config.provider}. Please set REACT_APP_AI_PROVIDER to 'gemini', 'ollama', or 'openai'.`, 'error', true);
    return null;
  }

  if (!rawResponse) {
    return null;
  }

  // Clean and validate response
  let text = rawResponse.replace(/`/g, '').replace(/\n/g, ' ').trim();
  console.debug(`[AI_CLEANED_RESPONSE] AI Player ${aiPlayer.id} (${promptPurpose}): "${text}"`);
  
  // Response format validation
  if (promptPurpose.endsWith('_TARGET') || promptPurpose === 'SEER_CHECK' || promptPurpose === 'GUARD_PROTECT' || promptPurpose === 'VOTE_PLAYER') {
      if (!/^\d+$/.test(text)) {
          addLog(`AI ${aiPlayer.id} (${promptPurpose}) invalid response format (should be numeric ID): "${text}"`, 'error', false); 
          console.warn(`[AI_FORMAT_WARN] AI ${aiPlayer.id} (${promptPurpose}) invalid response format (should be numeric ID): "${text}"`);
          const numMatch = text.match(/\d+/);
          if (numMatch) text = numMatch[0]; else return null; 
      }
  } else if (promptPurpose === 'WITCH_SAVE_CHOICE' || promptPurpose === 'HUNTER_SHOOT' || promptPurpose === 'WITCH_POISON_CHOICE') {
      // Accept both English (yes/no) and Chinese (是/否) responses
      if (!/^(yes|no|是|否|\d+)$/i.test(text)) {
           addLog(`AI ${aiPlayer.id} (${promptPurpose}) invalid response format (should be yes/no/是/否 or ID): "${text}"`, 'error', false); 
           console.warn(`[AI_FORMAT_WARN] AI ${aiPlayer.id} (${promptPurpose}) invalid response format (should be yes/no/是/否 or ID): "${text}"`);
           // Try to extract meaning from the response
           const lowerText = text.toLowerCase();
           if (lowerText.includes('yes') || text.includes('是')) text = 'yes';
           else if (lowerText.includes('no') || text.includes('否')) text = 'no';
           else { const numMatch = text.match(/\d+/); if (numMatch) text = numMatch[0]; else return null;}
      } else {
           // Normalize Chinese responses to English for consistency
           if (text === '是') text = 'yes';
           else if (text === '否') text = 'no';
      }
  }
  
  return text;
}; 