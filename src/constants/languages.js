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

    // 语音合成
    tts: {
      title: '语音设置',
      enabled: '启用AI语音',
      disabled: '禁用AI语音',
      volume: '音量',
      speed: '语速',
      pitch: '音调',
      testVoice: '测试语音',
      stopSpeaking: '停止播放',
      notSupported: '您的浏览器不支持语音合成。',
      testMessage: '这是一条测试消息，用于检查语音设置。',
      aiSpeaking: 'AI正在发言...',
      clickToStop: '点击停止',
      playMessage: '播放消息',
      playLogEntry: '播放日志条目'
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
      playerDied: '玩家 {{playerId}} 在昨晚死亡。',
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

    // AI Prompts
    aiPrompts: {
      playerInfo: {
        currentAlivePlayers: '当前存活玩家：',
        playerEntry: '  - 玩家 {{playerId}} ({{playerType}}，状态：存活，对你的身份：{{roleDisplay}})',
        human: '人类',
        ai: 'AI',
        unknownRole: '未知身份',
        yourTeammateWerewolf: '{{role}} (你的队友)',
        werewolfTeammates: '你的狼人队友是：{{teammates}}。',
        onlyWerewolfLeft: '你是最后一只狼人了。',
        yourInfo: '你的ID是 {{playerId}}，你的身份是 {{role}}。'
      },
      tasks: {
        werewolfTarget: {
          question: '狼人任务：现在是夜晚，轮到你行动了。选择一名玩家与你的狼人队友（如果有）一起攻击。主要目标是村民阵营的玩家。你可以攻击任何玩家，但在特殊情况下（比如混淆村民），你可以考虑攻击狼人队友。请只回复目标玩家的ID数字。',
          format: '请只回复目标玩家的ID数字。'
        },
        guardProtect: {
          question: '守卫任务：现在是夜晚，轮到你行动了。选择一名玩家保护免受狼人攻击。你不能连续两晚保护同一个人。昨晚你保护了{{lastProtected}}。请只回复目标玩家的ID数字。',
          format: '请只回复目标玩家的ID数字。',
          noOne: '没有人'
        },
        seerCheck: {
          question: '预言家任务：现在是夜晚，轮到你行动了。选择一名玩家查验他们的身份（村民或狼人）。请只回复目标玩家的ID数字。',
          format: '请只回复目标玩家的ID数字。'
        },
        witchSaveChoice: {
          question: '女巫任务：狼人攻击了玩家 {{targetId}}。你有解药，{{antidoteStatus}}。你想使用解药拯救玩家 {{targetId}} 吗？请只回复"是"（使用）或"否"（不使用）。',
          format: '请只回复"是"或"否"。',
          antidoteNotUsed: '尚未使用',
          antidoteUsed: '已经使用'
        },
        witchPoisonChoice: {
          question: '女巫任务：你有毒药，{{poisonStatus}}。你想使用毒药今晚杀死一名玩家吗？如果是，请回复目标玩家的ID数字；如果你不想使用毒药，请回复"否"。',
          format: '如果使用毒药，回复目标玩家的ID数字；如果不使用，回复"否"。',
          poisonNotUsed: '尚未使用',
          poisonUsed: '已经使用'
        },
        hunterShoot: {
          question: '猎人任务：你（玩家 {{playerId}}）刚刚死亡！现在你可以激活你的能力开枪并带走一名存活的玩家。选择一名玩家与你一起淘汰，或选择不开枪。如果开枪，只回复目标玩家的ID数字；如果选择不开枪，回复"否"。',
          format: '如果开枪，回复目标玩家的ID数字；如果不开枪，回复"否"。'
        },
        discussionStatement: {
          question: '讨论阶段：轮到你（玩家 {{playerId}} - {{role}}）发言了。\n\n**重要：请仔细分析历史信息来推理每个玩家的角色！**\n\n分析要点：\n1. **夜间行动模式**：注意谁在夜晚死亡、谁被救、保护是否成功等线索\n2. **发言行为**：分析每个玩家的发言内容、逻辑一致性、是否符合其声称的身份\n3. **投票模式**：观察每个玩家的投票目标和理由，是否有明显的阵营倾向\n4. **时间节点**：关注关键信息披露的时机，真预言家vs假预言家的区别\n5. **互动关系**：注意玩家之间的攻击、保护、支持关系\n\n基于以上分析，你的发言应该：\n- 符合你的身份和阵营目标\n- 如果你是狼人：隐藏身份，误导村民，制造混乱\n- 如果你是村民阵营：分享有用信息，指出可疑行为，推进正确推理\n- 保持发言简洁有力，1-2句话表达核心观点',
          format: '请直接回复你的发言内容。'
        },
        votePlayer: {
          question: '投票阶段：轮到你（玩家 {{playerId}} - {{role}}）投票了。\n\n**关键：基于完整的历史信息进行角色推理！**\n\n推理框架：\n1. **综合分析**：结合所有轮次的夜间结果、发言内容、投票行为\n2. **行为一致性**：检查每个玩家的行为是否与其声称的身份一致\n3. **阵营判断**：识别谁在推进村民利益，谁在制造混乱或保护狼人\n4. **威胁评估**：考虑谁对你的阵营威胁最大（狼人要除掉神职，村民要找出狼人）\n5. **信息价值**：优先投票给信息价值高的可疑目标\n\n投票策略：\n- 如果你是狼人：投票给对狼人阵营威胁最大的村民（特别是神职）\n- 如果你是村民阵营：投票给通过行为分析最可能是狼人的玩家\n- 避免盲目跟风，要有自己的判断理由\n\n请只回复你投票目标的玩家ID数字。',
          format: '请只回复目标玩家的ID数字。'
        }
      },
      gameHistory: '--- 当前游戏历史和状态（最新在底部） ---\n\n📊 **历史分析指南**：\n• 夜间死亡模式：分析死亡时间、保护/救治情况，推测角色能力\n• 发言内容分析：注意逻辑矛盾、信息来源、身份声明的真实性\n• 投票行为追踪：观察投票目标选择，识别阵营倾向和保护关系\n• 时机分析：关注关键信息披露时机，区分真假身份\n• 请基于完整历史记录进行推理，而非仅凭当前信息！',
      yourTask: '--- 你的任务 ---',
      historyEntry: '{{timestamp}} [{{speaker}}] {{text}}',
      speakers: {
        system: '系统',
        player: '玩家 {{playerId}}'
      }
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

    // Text-to-speech
    tts: {
      title: 'Voice Settings',
      enabled: 'Enable AI Voice',
      disabled: 'Disable AI Voice',
      volume: 'Volume',
      speed: 'Speed',
      pitch: 'Pitch',
      testVoice: 'Test Voice',
      stopSpeaking: 'Stop Speaking',
      notSupported: 'Text-to-speech is not supported in your browser.',
      testMessage: 'This is a test message to check the voice settings.',
      aiSpeaking: 'AI is speaking...',
      clickToStop: 'Click to stop',
      playMessage: 'Play Message',
      playLogEntry: 'Play Log Entry'
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
      playerDied: 'Player {{playerId}} died last night.',
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
      initializing: '正在初始化游戏...',
      randomRoleAssigned: '游戏开始！角色已随机分配。',
      selectedRoleAssigned: '游戏开始！你选择扮演{{role}}。'
    },

    // AI Prompts
    aiPrompts: {
      playerInfo: {
        currentAlivePlayers: 'Current alive players:',
        playerEntry: '  - Player {{playerId}} ({{playerType}}, Status: Alive, Role to you: {{roleDisplay}})',
        human: 'Human',
        ai: 'AI',
        unknownRole: 'Unknown Role',
        yourTeammateWerewolf: '{{role}} (your teammate)',
        werewolfTeammates: 'Your werewolf teammates are: {{teammates}}.',
        onlyWerewolfLeft: 'You are the only werewolf left.',
        yourInfo: 'Your ID is {{playerId}}, your role is {{role}}.'
      },
      tasks: {
        werewolfTarget: {
          question: 'Werewolf task: It\'s night and your turn to act. Choose a player to attack with your werewolf teammates (if any). Primary targets are villager faction players. You can attack any player, but in special situations (like confusing villagers), you may consider attacking werewolf teammates. Please only reply with the target player\'s ID number.',
          format: 'Please only reply with the target player\'s ID number.'
        },
        guardProtect: {
          question: 'Guard task: It\'s night and your turn to act. Choose a player to protect from werewolf attacks. You cannot protect the same person for two consecutive nights. Last night you protected {{lastProtected}}. Please only reply with the target player\'s ID number.',
          format: 'Please only reply with the target player\'s ID number.',
          noOne: 'no one'
        },
        seerCheck: {
          question: 'Seer task: It\'s night and your turn to act. Choose a player to check their identity (villager or werewolf). Please only reply with the target player\'s ID number.',
          format: 'Please only reply with the target player\'s ID number.'
        },
        witchSaveChoice: {
          question: 'Witch task: Werewolves attacked Player {{targetId}}. You have an antidote, {{antidoteStatus}}. Do you want to use the antidote to save Player {{targetId}}? Please only reply \'yes\' (use) or \'no\' (don\'t use).',
          format: 'Please only reply \'yes\' or \'no\'.',
          antidoteNotUsed: 'not used yet',
          antidoteUsed: 'already used'
        },
        witchPoisonChoice: {
          question: 'Witch task: You have a poison potion, {{poisonStatus}}. Do you want to use the poison to kill a player tonight? If yes, reply with the target player\'s ID number; if you don\'t want to use poison, reply \'no\'.',
          format: 'If using poison, reply with target player\'s ID number; if not using, reply \'no\'.',
          poisonNotUsed: 'not used yet',
          poisonUsed: 'already used'
        },
        hunterShoot: {
          question: 'Hunter task: You (Player {{playerId}}) just died! Now you can activate your ability to shoot and take one alive player with you. Choose a player to eliminate with you, or choose not to shoot. If shooting, reply only with the target player\'s ID number; if choosing not to shoot, reply \'no\'.',
          format: 'If shooting, reply with target player\'s ID number; if not shooting, reply \'no\'.'
        },
        discussionStatement: {
          question: 'Discussion phase: It\'s your turn (Player {{playerId}} - {{role}}) to speak.\n\n**IMPORTANT: Carefully analyze historical information to deduce each player\'s role!**\n\nAnalysis points:\n1. **Night action patterns**: Notice who died at night, who was saved, whether protections succeeded, etc.\n2. **Speech behavior**: Analyze each player\'s speech content, logical consistency, whether it matches their claimed identity\n3. **Voting patterns**: Observe each player\'s voting targets and reasons, whether they show clear faction tendencies\n4. **Timing**: Pay attention to when key information is revealed, differences between real vs fake seers\n5. **Interaction relationships**: Notice attack, protection, support relationships between players\n\nBased on this analysis, your speech should:\n- Align with your role and faction goals\n- If you\'re a werewolf: Hide identity, mislead villagers, create confusion\n- If you\'re villager faction: Share useful information, point out suspicious behavior, advance correct reasoning\n- Keep speech concise and powerful, 1-2 sentences expressing core viewpoint',
          format: 'Please directly reply with your speech content.'
        },
        votePlayer: {
          question: 'Voting phase: It\'s your turn (Player {{playerId}} - {{role}}) to vote.\n\n**KEY: Base your decision on complete historical information for role deduction!**\n\nReasoning framework:\n1. **Comprehensive analysis**: Combine all rounds of night results, speech content, voting behavior\n2. **Behavioral consistency**: Check if each player\'s behavior matches their claimed identity\n3. **Faction judgment**: Identify who advances villager interests vs who creates chaos or protects werewolves\n4. **Threat assessment**: Consider who poses the greatest threat to your faction (werewolves eliminate roles, villagers find werewolves)\n5. **Information value**: Prioritize voting for suspicious targets with high information value\n\nVoting strategy:\n- If you\'re a werewolf: Vote for villagers who threaten werewolf faction most (especially special roles)\n- If you\'re villager faction: Vote for players most likely to be werewolves based on behavioral analysis\n- Avoid blind following, have your own reasoning\n\nPlease only reply with your vote target\'s player ID number.',
          format: 'Please only reply with the target player\'s ID number.'
        }
      },
      gameHistory: '--- Current Game History and State (newest at bottom) ---\n\n📊 **Historical Analysis Guide**:\n• Night death patterns: Analyze death timing, protection/healing situations, deduce role abilities\n• Speech content analysis: Notice logical contradictions, information sources, authenticity of identity claims\n• Voting behavior tracking: Observe voting target choices, identify faction tendencies and protection relationships\n• Timing analysis: Focus on when key information is revealed, distinguish real vs fake identities\n• Base reasoning on complete historical records, not just current information!',
      yourTask: '--- Your Task ---',
      historyEntry: '{{timestamp}} [{{speaker}}] {{text}}',
      speakers: {
        system: 'System',
        player: 'Player {{playerId}}'
      }
    },

    // Game initialization
    gameInit: {
      initializing: 'Initializing game...',
      randomRoleAssigned: 'Game started! Roles randomly assigned.',
      selectedRoleAssigned: 'Game started! You chose to play {{role}}.'
    }
  }
}; 