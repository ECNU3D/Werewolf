import { ROLES } from '../constants/gameConstants';

// AI Provider Configuration
const getAIConfig = () => {
  const provider = process.env.REACT_APP_AI_PROVIDER || 'gemini'; // Default to gemini
  const config = {
    provider: provider.toLowerCase(),
  };

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

  return config;
};

// Ollama API call function
const callOllamaAPI = async (prompt, config, aiPlayer, promptPurpose, addLog) => {
  const apiUrl = `${config.baseUrl}/api/generate`;
  
  const payload = {
    model: config.model,
    prompt: prompt,
    stream: false,
    options: {
      temperature: 0.7,
      top_p: 0.9,
      stop: ["\n", "Player", "---"]
    }
  };

  console.debug(`[OLLAMA_REQUEST] AI Player ${aiPlayer.id} (${promptPurpose}) | Model: ${config.model} | URL: ${apiUrl}`);

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[OLLAMA_ERROR] AI ${aiPlayer.id} (${promptPurpose}) | Status: ${response.status} | Error: ${errorBody}`);
      
      if (response.status === 404) {
        addLog(`🤖 AI ${aiPlayer.id} - Ollama model '${config.model}' not found. Please pull the model first: ollama pull ${config.model}`, 'error', true);
      } else if (response.status === 500) {
        addLog(`🔧 AI ${aiPlayer.id} - Ollama server error. Check if Ollama is running on ${config.baseUrl}`, 'error', true);
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
      addLog(`🌐 AI ${aiPlayer.id} - Network error: Unable to connect to Ollama at ${config.baseUrl}. Check if Ollama is running.`, 'error', true);
    } else {
      addLog(`AI ${aiPlayer.id} (${promptPurpose}) Ollama error: ${error.message}`, 'error', true);
    }
    return null;
  }
};

// Gemini API call function
const callGeminiAPI = async (prompt, config, aiPlayer, promptPurpose, addLog) => {
  if (!config.apiKey || config.apiKey.trim() === '') {
    console.error("[GEMINI_ERROR] Gemini API key is not configured. Please set REACT_APP_GEMINI_API_KEY in your .env file.");
    addLog(`AI ${aiPlayer.id} (${promptPurpose}) Gemini API key not configured. Please check environment variables.`, 'error', true);
    return null;
  }

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`;
  
  const payload = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { stopSequences: ["\n"] }
  };

  console.debug(`[GEMINI_REQUEST] AI Player ${aiPlayer.id} (${promptPurpose}) | Model: ${config.model}`);

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
  if (!config.apiKey || config.apiKey.trim() === '') {
    console.error("[OPENAI_ERROR] OpenAI API key is not configured. Please set REACT_APP_OPENAI_API_KEY in your .env file.");
    addLog(`AI ${aiPlayer.id} (${promptPurpose}) OpenAI API key not configured. Please check environment variables.`, 'error', true);
    return null;
  }

  const apiUrl = `${config.baseUrl}/chat/completions`;
  
  const payload = {
    model: config.model,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 150,
    stop: ["\n", "Player", "---"]
  };

  console.debug(`[OPENAI_REQUEST] AI Player ${aiPlayer.id} (${promptPurpose}) | Model: ${config.model} | URL: ${apiUrl}`);

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
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
      addLog(`🌐 AI ${aiPlayer.id} - Network error: Unable to connect to OpenAI API at ${config.baseUrl}. Check your internet connection.`, 'error', true);
    } else {
      addLog(`AI ${aiPlayer.id} (${promptPurpose}) OpenAI thinking error: ${error.message}`, 'error', true);
    }
    return null;
  }
};

export const getAIDecision = async (aiPlayer, promptPurpose, currentHistory_param, gameState) => {
  const { 
    players, 
    seerLastCheck, 
    guardLastProtectedId, 
    werewolfTargetId, 
    witchPotions, 
    humanPlayerId, 
    addLog 
  } = gameState;

  // Get AI configuration
  const config = getAIConfig();
  console.debug(`[AI_CONFIG] Using provider: ${config.provider}, model: ${config.model}`);

  console.debug(`[AI_DECISION_START] AI Player ${aiPlayer.id} (${aiPlayer.role}) | Task: ${promptPurpose} | Provider: ${config.provider}`);
  let basePrompt = `${aiPlayer.aiSystemPrompt}\n`;
  basePrompt += `--- Current Game History and State (newest at bottom) ---\n${currentHistory_param.map(log => `${log.timestamp} [${log.type === 'human' ? `Player ${humanPlayerId}` : (log.type === 'ai' ? `Player ${aiPlayer.id}` : 'System')}] ${log.text}`).slice(-20).join('\n')}\n---\n`;
  
  const alivePlayerObjects = players.filter(p => p.isAlive);
  let alivePlayerInfo = "Current alive players:\n";
  alivePlayerObjects.forEach(p => {
      let roleDisplay = 'Unknown Role';
      if (p.id === aiPlayer.id) {
          roleDisplay = p.role; 
      } else if (aiPlayer.role === ROLES.WEREWOLF && p.role === ROLES.WEREWOLF) {
          roleDisplay = `${ROLES.WEREWOLF} (your teammate)`; 
      } else if (aiPlayer.role === ROLES.SEER && seerLastCheck && seerLastCheck.targetId === p.id) {
          roleDisplay = seerLastCheck.targetRole; 
      } else if (p.revealedRole) {
          roleDisplay = p.revealedRole;
      }
      alivePlayerInfo += `  - Player ${p.id} (${p.isHuman ? "Human" : "AI"}, Status: Alive, Role to you: ${roleDisplay})\n`;
  });
  basePrompt += alivePlayerInfo;
  
  if (aiPlayer.role === ROLES.WEREWOLF) {
      const otherWolves = players.filter(p => p.role === ROLES.WEREWOLF && p.id !== aiPlayer.id && p.isAlive);
      if (otherWolves.length > 0) {
          basePrompt += `Your werewolf teammates are: ${otherWolves.map(w => `Player ${w.id}`).join(', ')}.\n`;
      } else {
          basePrompt += `You are the only werewolf left.\n`;
      }
  }
  basePrompt += `Your ID is ${aiPlayer.id}, your role is ${aiPlayer.role}.\n`;

  let specificQuestion = "";
  let expectedFormat = "Please reply with your choice directly.";

  switch (promptPurpose) {
    case 'WEREWOLF_TARGET':
      specificQuestion = `Werewolf task: It's night and your turn to act. Choose a player to attack with your werewolf teammates (if any). Primary targets are villager faction players. You can attack any player, but in special situations (like confusing villagers), you may consider attacking werewolf teammates. Please only reply with the target player's ID number.`;
      expectedFormat = "Please only reply with the target player's ID number.";
      break;
    case 'GUARD_PROTECT':
      specificQuestion = `Guard task: It's night and your turn to act. Choose a player to protect from werewolf attacks. You cannot protect the same person for two consecutive nights. Last night you protected ${guardLastProtectedId === null ? 'no one' : `Player ${guardLastProtectedId}`}. Please only reply with the target player's ID number.`;
      expectedFormat = "Please only reply with the target player's ID number.";
      break;
    case 'SEER_CHECK':
      specificQuestion = `Seer task: It's night and your turn to act. Choose a player to check their identity (villager or werewolf). Please only reply with the target player's ID number.`;
      expectedFormat = "Please only reply with the target player's ID number.";
      break;
    case 'WITCH_SAVE_CHOICE': 
      const wolfVictim = players.find(p => p.id === werewolfTargetId);
      specificQuestion = `Witch task: Werewolves attacked Player ${werewolfTargetId} (${wolfVictim?.role || 'Unknown Role'}). You have an antidote, ${witchPotions.antidote ? 'not used yet' : 'already used'}. Do you want to use the antidote to save Player ${werewolfTargetId}? Please only reply 'yes' (use) or 'no' (don't use).`;
      expectedFormat = "Please only reply 'yes' or 'no'.";
      break;
    case 'WITCH_POISON_CHOICE': 
      specificQuestion = `Witch task: You have a poison potion, ${witchPotions.poison ? 'not used yet' : 'already used'}. Do you want to use the poison to kill a player tonight? If yes, reply with the target player's ID number; if you don't want to use poison, reply 'no'.`;
      expectedFormat = "If using poison, reply with target player's ID number; if not using, reply 'no'.";
      break;
    case 'HUNTER_SHOOT':
      specificQuestion = `Hunter task: You (Player ${aiPlayer.id}) just died! Now you can activate your ability to shoot and take one alive player with you. Choose a player to eliminate with you, or choose not to shoot. If shooting, reply only with the target player's ID number; if choosing not to shoot, reply 'no'.`;
      expectedFormat = "If shooting, reply with target player's ID number; if not shooting, reply 'no'.";
      break;
    case 'DISCUSSION_STATEMENT':
      specificQuestion = `Discussion phase: It's your turn (Player ${aiPlayer.id} - ${aiPlayer.role}) to speak. Based on your known information (including your role, night action results, others' speeches and voting history), analyze and take a stance. Your speech should align with your role and faction goals. For example, if you're a werewolf, hide your identity and mislead villagers; if you're a seer, carefully provide information. Keep your speech brief, one or two sentences summarizing your core viewpoint or action intention.`;
      expectedFormat = "Please directly reply with your speech content.";
      break;
    case 'VOTE_PLAYER':
      specificQuestion = `Voting phase: It's your turn (Player ${aiPlayer.id} - ${aiPlayer.role}) to vote. Based on all information, including others' speeches, vote for the player you think is most likely a werewolf or most harmful to your faction. Please only reply with your vote target's player ID number.`;
      expectedFormat = "Please only reply with the target player's ID number.";
      break;
    default:
      addLog(`AI ${aiPlayer.id} received unknown action type: ${promptPurpose}`, 'error', true);
      console.error(`[AI ERROR] AI ${aiPlayer.id} received unknown action type: ${promptPurpose}`);
      return null;
  }

  const fullPrompt = `${basePrompt}\n--- Your Task ---\n${specificQuestion}\n${expectedFormat}`;
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
      if (!/^(yes|no|\d+)$/i.test(text)) {
           addLog(`AI ${aiPlayer.id} (${promptPurpose}) invalid response format (should be yes/no or ID): "${text}"`, 'error', false); 
           console.warn(`[AI_FORMAT_WARN] AI ${aiPlayer.id} (${promptPurpose}) invalid response format (should be yes/no or ID): "${text}"`);
           if (text.toLowerCase().includes('yes')) text = 'yes';
           else if (text.toLowerCase().includes('no')) text = 'no';
           else { const numMatch = text.match(/\d+/); if (numMatch) text = numMatch[0]; else return null;}
      }
  }
  
  return text;
}; 