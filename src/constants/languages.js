export const LANGUAGES = {
  CHINESE: 'zh',
  ENGLISH: 'en'
};

export const LANGUAGE_NAMES = {
  [LANGUAGES.CHINESE]: '中文',
  [LANGUAGES.ENGLISH]: 'English'
};

export const translations = {
  [LANGUAGES.CHINESE]: {
    // Game title and meta
    gameTitle: '狼人杀',
    playerCount: '人局',
    classicGame: '经典推理游戏',
    gameDescription: '2狼人 vs 6好人',

    // Roles
    roles: {
      WEREWOLF: '狼人',
      SEER: '预言家',
      WITCH: '女巫',
      HUNTER: '猎人',
      GUARD: '守卫',
      VILLAGER: '平民'
    },

    // Game phases
    phases: {
      SETUP: '游戏设置',
      SHOW_ROLE_MODAL: '显示角色卡',
      NIGHT_START: '夜晚开始',
      WEREWOLVES_ACT: '狼人行动',
      GUARD_ACTS: '守卫行动',
      SEER_ACTS: '预言家行动',
      WITCH_ACTS_SAVE: '女巫行动 - 救人',
      WITCH_ACTS_POISON: '女巫行动 - 毒人',
      NIGHT_RESOLUTION: '夜晚结算',
      DAY_START: '白天开始 - 公布死讯',
      HUNTER_MAY_ACT: '猎人行动（如果死亡）',
      DISCUSSION: '讨论阶段',
      VOTING: '投票阶段',
      VOTE_RESULTS: '投票结果',
      GAME_OVER: '游戏结束'
    },

    // Setup screen
    setup: {
      chooseLanguage: '选择语言',
      selectRole: '选择角色',
      randomRole: '随机分配角色',
      startGame: '开始游戏',
      randomModeDesc: '系统将随机为你分配一个角色，增加游戏的不确定性和挑战性！',
      selectModeDesc: '选择你想要扮演的角色，体验不同的游戏策略和玩法！',
      selected: '已选择',
      difficulty: {
        easy: '简单',
        medium: '中等',
        hard: '困难'
      },
      roleDescriptions: {
        WEREWOLF: '夜晚杀害好人，白天隐藏身份',
        SEER: '每晚查验一人身份',
        WITCH: '拥有解药和毒药各一瓶',
        HUNTER: '死亡时可以带走一名玩家',
        GUARD: '每晚守护一人免受狼杀',
        VILLAGER: '依靠投票淘汰狼人'
      }
    },

    // Role modal
    roleModal: {
      yourRole: '你的身份是',
      victoryGoal: '获胜目标',
      specialAbility: '特殊能力',
      gameTips: '游戏提示',
      continueGame: '知道了，进入游戏',
      goals: {
        WEREWOLF: '消灭所有神民阵营的玩家',
        SEER: '找出并投票淘汰所有狼人',
        WITCH: '协助好人找出狼人',
        HUNTER: '协助好人找出狼人',
        GUARD: '协助好人找出狼人',
        VILLAGER: '协助好人找出狼人'
      },
      abilities: {
        WEREWOLF: '夜晚与同伴一起杀人，白天隐藏身份误导好人',
        SEER: '每晚可以查验一人身份',
        WITCH: '拥有解药和毒药各一瓶',
        HUNTER: '死亡时可以带走一名玩家',
        GUARD: '每晚守护一人免受狼杀',
        VILLAGER: '投票淘汰可疑玩家'
      },
      tips: {
        WEREWOLF: '注意配合队友，不要暴露身份',
        SEER: '谨慎地传递信息，避免被狼人发现',
        WITCH: '合理使用药剂，关键时刻能扭转局势',
        HUNTER: '即使死亡也要发挥最后的价值',
        GUARD: '不能连续两晚守护同一个人',
        VILLAGER: '仔细分析发言，找出真相'
      }
    },

    // Game info
    gameInfo: {
      currentPhase: '当前阶段',
      yourRole: '你的身份',
      potionsStatus: '药剂状态',
      antidoteAvailable: '解药可用',
      antidoteUsed: '解药已用',
      poisonAvailable: '毒药可用',
      poisonUsed: '毒药已用',
      seerResult: '查验结果',
      checkResult: '查验结果'
    },

    // Action panel
    actionPanel: {
      yourAction: '你的行动',
      witchSave: '女巫行动 - 救人',
      witchPoison: '女巫行动 - 毒人',
      yourTurn: '轮到你发言了',
      aiSpeaking: 'AI 发言中...',
      votingPhase: '投票阶段',
      waitingVotes: '等待其他玩家投票...',
      useAntidote: '使用解药',
      skipAntidote: '跳过',
      usePoison: '使用毒药',
      skipPoison: '跳过',
      startRecording: '开始录音',
      stopRecording: '停止录音',
      confirmSpeech: '确认发言',
      skipAISpeech: '跳过 AI 发言 (调试)',
      enterSpeech: '输入你的发言...',
      selectTarget: '请在右侧玩家列表中选择投票目标',
      werewolfAttacked: '狼人攻击了玩家',
      useAntidoteQuestion: '是否使用解药?',
      shootTarget: '开枪带走',
      noShoot: '不开枪'
    },

    // Game log
    gameLog: {
      title: '游戏记录',
      notStarted: '游戏尚未开始...',
      logTypes: {
        human: '玩家',
        ai: 'AI',
        error: '错误',
        system: '系统'
      }
    },

    // Player card
    playerCard: {
      alive: '存活',
      eliminated: '已淘汰',
      unknownRole: '未知身份',
      voteCount: '被投票数',
      you: '你',
      checkResult: '查验结果',
      buttons: {
        attack: '攻击',
        guard: '守护',
        check: '查验',
        poison: '毒杀',
        vote: '投票',
        shoot: '射杀'
      }
    },

    // Game over
    gameOver: {
      werewolvesWin: '🐺 狼人阵营胜利！🐺',
      villagersWin: '🧑‍🌾 平民阵营胜利！🧑‍🌾',
      gameEnd: '游戏结束！',
      finalRoles: '最终身份',
      restart: '重新开始'
    },

    // Common actions and messages
    common: {
      confirm: '确认',
      cancel: '取消',
      continue: '继续',
      skip: '跳过',
      select: '选择',
      player: '玩家',
      you: '你',
      unknown: '未知'
    },

    // Speech and interaction
    speech: {
      yourSpeech: '你 (玩家 {{id}}) 说: {{text}}',
      skipSpeech: '你 (玩家 {{id}}) 选择跳过发言。',
      speechError: '语音识别错误: {{error}}',
      noSpeechSupport: '您的浏览器不支持语音识别。请手动输入发言。',
      checkMicrophone: '请尝试手动输入或检查麦克风权限。',
      startSpeaking: '请开始发言...'
    },

    // Error messages
    errors: {
      needTarget: '你需要选择一个目标。',
      invalidTarget: '目标无效或已死亡。',
      cannotProtectSame: '不能连续两晚守护同一个人。',
      needVoteTarget: '你需要选择投票给一名玩家。',
      cannotVoteSelf: '你不能投票给自己。',
      cannotAction: '你无法行动。',
      witchCannotPoisonSelf: '女巫不能毒自己。',
      hunterCannotShootSelf: '猎人不能射杀自己。'
    },

    // Actions and player responses
    actions: {
      werewolfSelected: '你选择了攻击玩家 {{playerId}}。',
      guardNeedTarget: '你需要选择守护一名玩家。',
      guardSelected: '你选择了守护玩家 {{playerId}}。',
      seerNeedTarget: '你需要选择查验一名玩家。',
      seerOnlyAlive: '通常只能查验存活的玩家。',
      seerChecked: '你查验了玩家 {{playerId}}。',
      antidoteNoTarget: '无人被狼人攻击，或目标已死亡，无法使用解药。',
      usedAntidote: '你对玩家 {{playerId}} 使用了解药。',
      skippedAntidote: '你选择不使用解药{{reason}}。',
      usedPoison: '你对玩家 {{playerId}} 使用了毒药。',
      skippedPoison: '你选择不使用毒药{{reason}}。',
      hunterShot: '你 (猎人) 开枪带走了玩家 {{playerId}} ({{role}})！',
      hunterNoShoot: '你 (猎人) 选择不开枪。',
      voted: '你投票给了玩家 {{playerId}}。'
    },

    // Game phases and messages
    gamePhases: {
      nightStart: '夜幕降临，请闭眼。狼人请行动。',
      waitingWerewolf: '等待你（狼人）选择攻击目标...',
      werewolfDone: '狼人行动结束。守卫请行动。',
      guardDone: '守卫行动结束。预言家请行动。',
      seerDone: '预言家行动结束。女巫请行动。',
      witchPoisonDecision: '女巫请决定是否使用毒药。',
      witchDone: '女巫行动结束。夜晚结束，天亮了！',
      dayStart: '天亮了。',
      playerDied: '玩家 {{playerId}} ({{role}}) 在昨晚死亡。',
      hunterDied: '猎人玩家 {{playerId}} 已死亡，请选择是否开枪。',
      discussionStart: '进入讨论阶段。',
      firstSpeaker: '首先请玩家 {{playerId}} 发言。',
      waitingHunter: '等待你（猎人）决定是否开枪...',
      hunterDone: '猎人行动结束。进入讨论阶段。',
      playerSpeaks: '玩家 {{playerId}} 说: {{statement}}',
      skipSpeech: '选择跳过发言。',
      discussionDone: '所有存活玩家发言完毕，进入投票阶段。',
      waitingVote: '等待你投票...',
      votingDone: '投票结束。正在统计结果。',
      executionError: '游戏步骤执行出错，请检查控制台。'
    },

    // Game results
    gameResults: {
      allDead: '所有玩家都已死亡！游戏平局或出现错误！',
      villagersWin: '所有狼人已被消灭！平民阵营胜利！',
      werewolvesWin: '狼人数量达到或超过好人数量！狼人阵营胜利！'
    },

    // Night actions
    nightActions: {
      guardProtected: '玩家 {{playerId}} 被狼人攻击，但被守卫保护了！',
      witchSaved: '玩家 {{playerId}} 被狼人攻击，但被女巫用解药救活了！',
      werewolfKilled: '昨晚，玩家 {{playerId}} 被杀害了。',
      killedByWerewolf: '狼人杀害',
      werewolfMissed: '昨晚狼人似乎没有得手，或者目标已经死亡。',
      peacefulNight: '昨晚是个平安夜（狼人没有选择目标）。',
      witchPoisoned: '玩家 {{playerId}} 被女巫毒杀了。',
      poisonedByWitch: '女巫毒杀',
      witchPoisonedMultiple: '玩家 {{playerId}} 被女巫毒杀了 (也可能曾是狼人目标)。',
      noneDeadPeaceful: '昨晚是平安夜，无人死亡。',
      noneDeadAfterActions: '昨晚行动过后，无人死亡。'
    },

    // Voting
    voting: {
      playerEliminated: '玩家 {{playerId}} ({{role}}) 被投票出局！',
      tieVote: '投票出现平票，本轮无人出局。',
      noElimination: '无人获得足够票数，或无人投票，本轮无人出局。'
    },

    // Speaking
    speaking: {
      nextSpeaker: '轮到玩家 {{playerId}} 发言。'
    },

    // AI voting actions
    aiVoting: {
      playerVoted: '玩家 {{aiPlayerId}} 投票给玩家 {{targetId}}。',
      playerVotedRandom: '玩家 {{aiPlayerId}} (随机) 投票给玩家 {{targetId}}。',
      playerAbstained: '玩家 {{aiPlayerId}} 弃票 (无有效目标)。'
    },

  },

  [LANGUAGES.ENGLISH]: {
    // Game title and meta
    gameTitle: 'Werewolf',
    playerCount: ' players',
    classicGame: 'Classic deduction game',
    gameDescription: '2 Werewolves vs 6 Villagers',

    // Roles
    roles: {
      WEREWOLF: 'Werewolf',
      SEER: 'Seer',
      WITCH: 'Witch',
      HUNTER: 'Hunter',
      GUARD: 'Guard',
      VILLAGER: 'Villager'
    },

    // Game phases
    phases: {
      SETUP: 'Game Setup',
      SHOW_ROLE_MODAL: 'Show Role Card',
      NIGHT_START: 'Night Begins',
      WEREWOLVES_ACT: 'Werewolves Act',
      GUARD_ACTS: 'Guard Acts',
      SEER_ACTS: 'Seer Acts',
      WITCH_ACTS_SAVE: 'Witch Acts - Save',
      WITCH_ACTS_POISON: 'Witch Acts - Poison',
      NIGHT_RESOLUTION: 'Night Resolution',
      DAY_START: 'Day Begins - Death Announcement',
      HUNTER_MAY_ACT: 'Hunter Acts (if dead)',
      DISCUSSION: 'Discussion Phase',
      VOTING: 'Voting Phase',
      VOTE_RESULTS: 'Vote Results',
      GAME_OVER: 'Game Over'
    },

    // Setup screen
    setup: {
      chooseLanguage: 'Choose Language',
      selectRole: 'Select Role',
      randomRole: 'Random Role Assignment',
      startGame: 'Start Game',
      randomModeDesc: 'The system will randomly assign you a role, adding uncertainty and challenge to the game!',
      selectModeDesc: 'Choose the role you want to play and experience different game strategies!',
      selected: 'Selected',
      difficulty: {
        easy: 'Easy',
        medium: 'Medium',
        hard: 'Hard'
      },
      roleDescriptions: {
        WEREWOLF: 'Kill villagers at night, hide identity during day',
        SEER: 'Check one player\'s identity each night',
        WITCH: 'Has one antidote and one poison potion',
        HUNTER: 'Can take one player with them when dying',
        GUARD: 'Protect one player from werewolf attacks each night',
        VILLAGER: 'Vote to eliminate suspicious players'
      }
    },

    // Role modal
    roleModal: {
      yourRole: 'Your role is',
      victoryGoal: 'Victory Goal',
      specialAbility: 'Special Ability',
      gameTips: 'Game Tips',
      continueGame: 'Got it, enter game',
      goals: {
        WEREWOLF: 'Eliminate all villager faction players',
        SEER: 'Find and vote out all werewolves',
        WITCH: 'Help villagers find werewolves',
        HUNTER: 'Help villagers find werewolves',
        GUARD: 'Help villagers find werewolves',
        VILLAGER: 'Help villagers find werewolves'
      },
      abilities: {
        WEREWOLF: 'Kill with teammates at night, mislead villagers during day',
        SEER: 'Check one player\'s identity each night',
        WITCH: 'Has one antidote and one poison potion',
        HUNTER: 'Can shoot one player when dying',
        GUARD: 'Protect one player from werewolf attacks each night',
        VILLAGER: 'Vote to eliminate suspicious players'
      },
      tips: {
        WEREWOLF: 'Coordinate with teammates, don\'t expose your identity',
        SEER: 'Share information carefully, avoid being discovered by werewolves',
        WITCH: 'Use potions wisely, they can turn the tide at crucial moments',
        HUNTER: 'Make your death count even at the last moment',
        GUARD: 'Cannot protect the same person for two consecutive nights',
        VILLAGER: 'Analyze speeches carefully to find the truth'
      }
    },

    // Game info
    gameInfo: {
      currentPhase: 'Current Phase',
      yourRole: 'Your Role',
      potionsStatus: 'Potions Status',
      antidoteAvailable: 'Antidote Available',
      antidoteUsed: 'Antidote Used',
      poisonAvailable: 'Poison Available',
      poisonUsed: 'Poison Used',
      seerResult: 'Seer Result',
      checkResult: 'Check Result'
    },

    // Action panel
    actionPanel: {
      yourAction: 'Your Action',
      witchSave: 'Witch Action - Save',
      witchPoison: 'Witch Action - Poison',
      yourTurn: 'Your turn to speak',
      aiSpeaking: 'AI speaking...',
      votingPhase: 'Voting Phase',
      waitingVotes: 'Waiting for other players to vote...',
      useAntidote: 'Use Antidote',
      skipAntidote: 'Skip',
      usePoison: 'Use Poison',
      skipPoison: 'Skip',
      startRecording: 'Start Recording',
      stopRecording: 'Stop Recording',
      confirmSpeech: 'Confirm Speech',
      skipAISpeech: 'Skip AI Speech (Debug)',
      enterSpeech: 'Enter your speech...',
      selectTarget: 'Please select a voting target from the player list on the right',
      werewolfAttacked: 'Werewolf attacked player',
      useAntidoteQuestion: 'Use antidote?',
      shootTarget: 'Shoot',
      noShoot: 'Don\'t shoot'
    },

    // Game log
    gameLog: {
      title: 'Game Record',
      notStarted: 'Game has not started yet...',
      logTypes: {
        human: 'Player',
        ai: 'AI',
        error: 'Error',
        system: 'System'
      }
    },

    // Player card
    playerCard: {
      alive: 'Alive',
      eliminated: 'Eliminated',
      unknownRole: 'Unknown Role',
      voteCount: 'Vote Count',
      you: 'You',
      checkResult: 'Check Result',
      buttons: {
        attack: 'Attack',
        guard: 'Guard',
        check: 'Check',
        poison: 'Poison',
        vote: 'Vote',
        shoot: 'Shoot'
      }
    },

    // Game over
    gameOver: {
      werewolvesWin: '🐺 Werewolves Win! 🐺',
      villagersWin: '🧑‍🌾 Villagers Win! 🧑‍🌾',
      gameEnd: 'Game Over!',
      finalRoles: 'Final Roles',
      restart: 'Restart'
    },

    // Common actions and messages
    common: {
      confirm: 'Confirm',
      cancel: 'Cancel',
      continue: 'Continue',
      skip: 'Skip',
      select: 'Select',
      player: 'Player',
      you: 'You',
      unknown: 'Unknown'
    },

    // Speech and interaction
    speech: {
      yourSpeech: 'You (Player {{id}}) said: {{text}}',
      skipSpeech: 'You (Player {{id}}) chose to skip speaking.',
      speechError: 'Speech recognition error: {{error}}',
      noSpeechSupport: 'Your browser does not support speech recognition. Please type manually.',
      checkMicrophone: 'Please try typing manually or check microphone permissions.',
      startSpeaking: 'Please start speaking...'
    },

    // Error messages
    errors: {
      needTarget: 'You need to select a target.',
      invalidTarget: 'Invalid target or already dead.',
      cannotProtectSame: 'Cannot protect the same person two nights in a row.',
      needVoteTarget: 'You need to select a player to vote for.',
      cannotVoteSelf: 'You cannot vote for yourself.',
      cannotAction: 'You cannot take action.',
      witchCannotPoisonSelf: 'The witch cannot poison herself.',
      hunterCannotShootSelf: 'The hunter cannot shoot himself.'
    },

    // Actions and player responses
    actions: {
      werewolfSelected: 'You chose to attack player {{playerId}}.',
      guardNeedTarget: 'You need to select a player to guard.',
      guardSelected: 'You chose to guard player {{playerId}}.',
      seerNeedTarget: 'You need to select a player to check.',
      seerOnlyAlive: 'Usually can only check living players.',
      seerChecked: 'You checked player {{playerId}}.',
      antidoteNoTarget: 'No one was attacked by werewolves, or target is dead, cannot use antidote.',
      usedAntidote: 'You used the antidote on player {{playerId}}.',
      skippedAntidote: 'You chose not to use the antidote{{reason}}.',
      usedPoison: 'You used poison on player {{playerId}}.',
      skippedPoison: 'You chose not to use poison{{reason}}.',
      hunterShot: 'You (hunter) shot and took down player {{playerId}} ({{role}})!',
      hunterNoShoot: 'You (hunter) chose not to shoot.',
      voted: 'You voted for player {{playerId}}.'
    },

    // Error messages
    errors: {
      needTarget: 'You need to select a target.',
      invalidTarget: 'Invalid target or already dead.',
      cannotProtectSame: 'Cannot protect the same person for two consecutive nights.',
      needVoteTarget: 'You need to select a player to vote for.',
      cannotVoteSelf: 'You cannot vote for yourself.',
      cannotAction: 'You cannot act.',
      witchCannotPoisonSelf: 'Witch cannot poison herself.',
      hunterCannotShootSelf: 'Hunter cannot shoot himself.'
    },

    // Game phases and messages
    gamePhases: {
      nightStart: 'Night falls, please close your eyes. Werewolves, please act.',
      waitingWerewolf: 'Waiting for you (Werewolf) to choose an attack target...',
      werewolfDone: 'Werewolf actions are done. Guard, please act.',
      guardDone: 'Guard actions are done. Seer, please act.',
      seerDone: 'Seer actions are done. Witch, please act.',
      witchPoisonDecision: 'Witch, please decide whether to use poison.',
      witchDone: 'Witch actions are done. Night is over!',
      dayStart: 'It\'s morning.',
      playerDied: 'Player {{playerId}} ({{role}}) died last night.',
      hunterDied: 'Hunter player {{playerId}} is dead. Please decide whether to shoot.',
      discussionStart: 'Enter discussion phase.',
      firstSpeaker: 'First, please speak player {{playerId}}.',
      waitingHunter: 'Waiting for you (Hunter) to decide whether to shoot...',
      hunterDone: 'Hunter actions are done. Enter discussion phase.',
      playerSpeaks: 'Player {{playerId}} said: {{statement}}',
      skipSpeech: 'Chose to skip speaking.',
      discussionDone: 'All alive players have spoken. Enter voting phase.',
      waitingVote: 'Waiting for your vote...',
      votingDone: 'Voting is done. Results are being tallied.',
      executionError: 'Game step execution error. Please check the console.'
    },

    // Game results
    gameResults: {
      allDead: 'All players are dead! Draw or error!',
      villagersWin: 'All werewolves eliminated! Villagers win!',
      werewolvesWin: 'Werewolves equal or outnumber villagers! Werewolves win!'
    },

    // Night actions
    nightActions: {
      guardProtected: 'Player {{playerId}} was attacked by werewolves but protected by the guard!',
      witchSaved: 'Player {{playerId}} was attacked by werewolves but saved by the witch\'s antidote!',
      werewolfKilled: 'Last night, Player {{playerId}} was killed.',
      killedByWerewolf: 'Killed by werewolf',
      werewolfMissed: 'The werewolves didn\'t succeed last night, or the target was already dead.',
      peacefulNight: 'Last night was peaceful (werewolves chose no target).',
      witchPoisoned: 'Player {{playerId}} was poisoned by the witch.',
      poisonedByWitch: 'Poisoned by witch',
      witchPoisonedMultiple: 'Player {{playerId}} was poisoned by the witch (may have also been werewolf target).',
      noneDeadPeaceful: 'Last night was peaceful, no one died.',
      noneDeadAfterActions: 'After last night\'s actions, no one died.'
    },

    // Voting
    voting: {
      playerEliminated: 'Player {{playerId}} ({{role}}) was voted out!',
      tieVote: 'Vote resulted in a tie, no one eliminated this round.',
      noElimination: 'No one received enough votes, no one eliminated this round.'
    },

    // Speaking
    speaking: {
      nextSpeaker: 'It\'s Player {{playerId}}\'s turn to speak.'
    },

    // AI voting actions
    aiVoting: {
      playerVoted: 'Player {{aiPlayerId}} voted for Player {{targetId}}.',
      playerVotedRandom: 'Player {{aiPlayerId}} (randomly) voted for Player {{targetId}}.',
      playerAbstained: 'Player {{aiPlayerId}} abstained (no valid targets).'
    },

    // Game initialization
    gameInit: {
      initializing: '游戏初始化...',
      randomRoleAssigned: '游戏开始！身份已随机分配。',
      selectedRoleAssigned: '游戏开始！你选择扮演 {{role}}。'
    },

    // Game initialization
    gameInit: {
      initializing: 'Initializing game...',
      randomRoleAssigned: 'Game started! Roles randomly assigned.',
      selectedRoleAssigned: 'Game started! You chose to play {{role}}.'
    }
  }
}; 