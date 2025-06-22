import { ROLES } from '../constants/gameConstants';

// Log visibility levels
export const LOG_VISIBILITY = {
  PUBLIC: 'PUBLIC',           // Visible to everyone (UI and AI)
  PRIVATE: 'PRIVATE',         // Only visible to specific roles/players
  SYSTEM: 'SYSTEM',           // Only visible in console/debug
  AI_ONLY: 'AI_ONLY',         // Only visible to AI for decision making
  UI_ONLY: 'UI_ONLY'          // Only visible in UI, not sent to AI
};

// Log categories for better organization
export const LOG_CATEGORIES = {
  GAME_FLOW: 'GAME_FLOW',         // Phase transitions, general game events
  ACTIONS: 'ACTIONS',             // Player actions (speak, vote, use abilities)
  NIGHT_ACTIONS: 'NIGHT_ACTIONS', // Night phase specific actions
  DEATHS: 'DEATHS',               // Death announcements
  VOTING: 'VOTING',               // Voting related events
  ROLE_INFO: 'ROLE_INFO',         // Role-specific information
  DISCUSSION: 'DISCUSSION',       // Discussion phase speeches
  ROUND_SUMMARY: 'ROUND_SUMMARY', // Summary of each round
  ERROR: 'ERROR',                 // Error messages
  DEBUG: 'DEBUG'                  // Debug information
};

// Role-specific information access
const ROLE_PRIVILEGES = {
  [ROLES.WEREWOLF]: {
    canSee: ['werewolf_kills', 'werewolf_targets', 'teammate_info'],
    shouldKnow: ['who_they_killed_before', 'teammate_identities']
  },
  [ROLES.SEER]: {
    canSee: ['seer_results'],
    shouldKnow: ['previous_check_results']
  },
  [ROLES.WITCH]: {
    canSee: ['witch_actions', 'wolf_targets'],
    shouldKnow: ['potion_usage_history', 'who_was_attacked']
  },
  [ROLES.GUARD]: {
    canSee: ['guard_protections'],
    shouldKnow: ['previous_protections', 'protection_results']
  },
  [ROLES.HUNTER]: {
    canSee: ['hunter_shots'],
    shouldKnow: ['death_trigger_info']
  },
  [ROLES.VILLAGER]: {
    canSee: [],
    shouldKnow: ['public_information_only']
  }
};

class LogEntry {
  constructor({
    id,
    message,
    type = 'system',
    category = LOG_CATEGORIES.GAME_FLOW,
    visibility = LOG_VISIBILITY.PUBLIC,
    visibleToRoles = [],
    visibleToPlayers = [],
    timestamp = new Date().toLocaleTimeString(),
    metadata = {}
  }) {
    this.id = id;
    this.message = message;
    this.type = type;
    this.category = category;
    this.visibility = visibility;
    this.visibleToRoles = visibleToRoles;
    this.visibleToPlayers = visibleToPlayers;
    this.timestamp = timestamp;
    this.metadata = metadata;
  }

  // Check if this log entry should be visible to a specific player
  isVisibleToPlayer(playerId, playerRole, humanPlayerId) {
    // PUBLIC logs are visible to everyone
    if (this.visibility === LOG_VISIBILITY.PUBLIC) {
      return true;
    }

    // PRIVATE logs check specific roles and players
    if (this.visibility === LOG_VISIBILITY.PRIVATE) {
      if (this.visibleToRoles.includes(playerRole)) return true;
      if (this.visibleToPlayers.includes(playerId)) return true;
      return false;
    }

    // SYSTEM logs are not visible to players
    if (this.visibility === LOG_VISIBILITY.SYSTEM) {
      return false;
    }

    // AI_ONLY logs are only for AI decision making
    if (this.visibility === LOG_VISIBILITY.AI_ONLY) {
      return playerId !== humanPlayerId; // Only visible to AI players
    }

    // UI_ONLY logs are only visible in UI
    if (this.visibility === LOG_VISIBILITY.UI_ONLY) {
      return playerId === humanPlayerId; // Only visible to human player
    }

    return false;
  }

  // Check if this log should be included in AI prompts
  isVisibleToAI(aiPlayerRole) {
    if (this.visibility === LOG_VISIBILITY.UI_ONLY) return false;
    if (this.visibility === LOG_VISIBILITY.SYSTEM) return false;
    
    if (this.visibility === LOG_VISIBILITY.PRIVATE) {
      return this.visibleToRoles.includes(aiPlayerRole);
    }

    return true; // PUBLIC and AI_ONLY are visible to AI
  }
}

export class LogManager {
  constructor() {
    this.logs = [];
    this.logIdCounter = 0;
  }

  // Add a new log entry
  addLog({
    message,
    type = 'system',
    category = LOG_CATEGORIES.GAME_FLOW,
    visibility = LOG_VISIBILITY.PUBLIC,
    visibleToRoles = [],
    visibleToPlayers = [],
    metadata = {}
  }) {
    const logEntry = new LogEntry({
      id: ++this.logIdCounter,
      message,
      type,
      category,
      visibility,
      visibleToRoles,
      visibleToPlayers,
      metadata
    });

    this.logs.push(logEntry);
    
    // Always log to console for debugging
    console.log(`[LOG][${type}][${category}][${visibility}] ${message}`);
    
    return logEntry.id;
  }

  // Get logs visible to a specific player for UI display
  getUILogsForPlayer(playerId, playerRole, humanPlayerId) {
    return this.logs
      .filter(log => log.isVisibleToPlayer(playerId, playerRole, humanPlayerId))
      .map(log => ({
        text: log.message,
        type: log.type,
        timestamp: log.timestamp,
        category: log.category
      }));
  }

  // Get logs for AI decision making
  getAILogsForRole(aiPlayerRole, includeRoleSpecificInfo = true) {
    let filteredLogs = this.logs.filter(log => log.isVisibleToAI(aiPlayerRole));
    
    // Sort logs by creation order to maintain chronological sequence
    filteredLogs.sort((a, b) => a.id - b.id);
    
    if (includeRoleSpecificInfo) {
      // Add role-specific historical information
      filteredLogs = this.enhanceLogsForRole(filteredLogs, aiPlayerRole);
    }

    return filteredLogs.map(log => ({
      text: log.message,
      type: log.type,
      timestamp: log.timestamp,
      category: log.category,
      metadata: log.metadata
    }));
  }

  // Enhance logs with role-specific information
  enhanceLogsForRole(logs, role) {
    // This could be expanded to add role-specific context
    return logs;
  }

  // Helper methods for common log types
  addPublicLog(message, type = 'system', category = LOG_CATEGORIES.GAME_FLOW, metadata = {}) {
    return this.addLog({
      message,
      type,
      category,
      visibility: LOG_VISIBILITY.PUBLIC,
      metadata
    });
  }

  addPrivateLog(message, visibleToRoles = [], visibleToPlayers = [], type = 'system', category = LOG_CATEGORIES.ROLE_INFO, metadata = {}) {
    return this.addLog({
      message,
      type,
      category,
      visibility: LOG_VISIBILITY.PRIVATE,
      visibleToRoles,
      visibleToPlayers,
      metadata
    });
  }

  addSystemLog(message, type = 'system', category = LOG_CATEGORIES.DEBUG, metadata = {}) {
    return this.addLog({
      message,
      type,
      category,
      visibility: LOG_VISIBILITY.SYSTEM,
      metadata
    });
  }

  addAIOnlyLog(message, type = 'system', category = LOG_CATEGORIES.GAME_FLOW, metadata = {}) {
    return this.addLog({
      message,
      type,
      category,
      visibility: LOG_VISIBILITY.AI_ONLY,
      metadata
    });
  }

  addUIOnlyLog(message, type = 'system', category = LOG_CATEGORIES.GAME_FLOW, metadata = {}) {
    return this.addLog({
      message,
      type,
      category,
      visibility: LOG_VISIBILITY.UI_ONLY,
      metadata
    });
  }

  // Night actions - these need special handling
  addNightActionLog(actionType, details, playerRole) {
    const { playerId, targetId, wasSuccessful, reason } = details;

    switch (actionType) {
      case 'werewolf_kill':
        // Werewolves should know who they targeted
        this.addPrivateLog(
          `你们攻击了玩家 ${targetId}`,
          [ROLES.WEREWOLF],
          [],
          'ai',
          LOG_CATEGORIES.NIGHT_ACTIONS,
          { actionType, playerId, targetId, wasSuccessful }
        );
        break;

      case 'guard_protect':
        // Guard should remember who they protected
        this.addPrivateLog(
          `你守护了玩家 ${targetId}`,
          [ROLES.GUARD],
          [playerId],
          'ai',
          LOG_CATEGORIES.NIGHT_ACTIONS,
          { actionType, playerId, targetId }
        );
        break;

      case 'seer_check':
        // Seer should know their check results
        this.addPrivateLog(
          `你查验了玩家 ${targetId}，结果是：${reason}`,
          [ROLES.SEER],
          [playerId],
          'ai',
          LOG_CATEGORIES.NIGHT_ACTIONS,
          { actionType, playerId, targetId, result: reason }
        );
        break;

      case 'witch_save':
        // Witch should know who they saved
        this.addPrivateLog(
          `你使用解药救了玩家 ${targetId}`,
          [ROLES.WITCH],
          [playerId],
          'ai',
          LOG_CATEGORIES.NIGHT_ACTIONS,
          { actionType, playerId, targetId }
        );
        break;

      case 'witch_poison':
        // Witch should know who they poisoned
        this.addPrivateLog(
          `你使用毒药毒了玩家 ${targetId}`,
          [ROLES.WITCH],
          [playerId],
          'ai',
          LOG_CATEGORIES.NIGHT_ACTIONS,
          { actionType, playerId, targetId }
        );
        break;
    }
  }

  // Death announcements - only show results, not the causes
  addDeathAnnouncement(deadPlayerIds, publicMessage) {
    // Public announcement of deaths (no details about how they died)
    this.addPublicLog(
      publicMessage,
      'system',
      LOG_CATEGORIES.DEATHS
    );
  }

  // Voting logs
  addVotingLog(voterId, targetId, voterRole) {
    if (voterRole) {
      // AI vote - visible to everyone
      this.addPublicLog(
        `玩家 ${voterId} 投票给玩家 ${targetId}`,
        'ai',
        LOG_CATEGORIES.VOTING,
        { voterId, targetId }
      );
    } else {
      // Human vote - visible to everyone
      this.addPublicLog(
        `你投票给了玩家 ${targetId}`,
        'human',
        LOG_CATEGORIES.VOTING,
        { voterId, targetId }
      );
    }
  }

  // Add round summary for better AI context
  addRoundSummary(roundNumber, summary) {
    this.addPublicLog(
      `=== 第${roundNumber}轮总结 ===\n${summary}`,
      'system',
      LOG_CATEGORIES.ROUND_SUMMARY,
      { roundNumber, summary }
    );
  }

  // Clear all logs (for game restart)
  clearLogs() {
    this.logs = [];
    this.logIdCounter = 0;
  }

  // Get logs by category
  getLogsByCategory(category, playerId = null, playerRole = null, humanPlayerId = null) {
    let filteredLogs = this.logs.filter(log => log.category === category);
    
    if (playerId !== null && playerRole !== null && humanPlayerId !== null) {
      filteredLogs = filteredLogs.filter(log => 
        log.isVisibleToPlayer(playerId, playerRole, humanPlayerId)
      );
    }
    
    return filteredLogs;
  }

  // Debug method to get all logs
  getAllLogs() {
    return this.logs;
  }
}

// Export a singleton instance
export const logManager = new LogManager(); 