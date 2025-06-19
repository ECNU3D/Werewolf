import { ROLES } from '../constants/gameConstants';

const RoleModal = ({ humanPlayer, onContinue }) => {
  if (!humanPlayer) return null;

  const getRoleIcon = (role) => {
    const icons = {
      [ROLES.WEREWOLF]: '🐺',
      [ROLES.SEER]: '🔮',
      [ROLES.WITCH]: '🧙‍♀️',
      [ROLES.HUNTER]: '🏹',
      [ROLES.GUARD]: '🛡️',
      [ROLES.VILLAGER]: '👤',
    };
    return icons[role] || '❓';
  };

  const getRoleTheme = (role) => {
    const themes = {
      [ROLES.WEREWOLF]: {
        bg: 'from-red-900/90 via-red-800/90 to-red-900/90',
        border: 'border-red-400/50',
        title: 'text-red-300',
        accent: 'text-red-200',
        button: 'from-red-600 to-red-700 hover:from-red-700 hover:to-red-800',
        glow: 'shadow-red-500/20'
      },
      [ROLES.SEER]: {
        bg: 'from-blue-900/90 via-purple-800/90 to-blue-900/90',
        border: 'border-blue-400/50',
        title: 'text-blue-300',
        accent: 'text-blue-200',
        button: 'from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800',
        glow: 'shadow-blue-500/20'
      },
      [ROLES.WITCH]: {
        bg: 'from-purple-900/90 via-pink-800/90 to-purple-900/90',
        border: 'border-purple-400/50',
        title: 'text-purple-300',
        accent: 'text-purple-200',
        button: 'from-purple-600 to-pink-700 hover:from-purple-700 hover:to-pink-800',
        glow: 'shadow-purple-500/20'
      },
      [ROLES.HUNTER]: {
        bg: 'from-orange-900/90 via-red-800/90 to-orange-900/90',
        border: 'border-orange-400/50',
        title: 'text-orange-300',
        accent: 'text-orange-200',
        button: 'from-orange-600 to-red-700 hover:from-orange-700 hover:to-red-800',
        glow: 'shadow-orange-500/20'
      },
      [ROLES.GUARD]: {
        bg: 'from-green-900/90 via-emerald-800/90 to-green-900/90',
        border: 'border-green-400/50',
        title: 'text-green-300',
        accent: 'text-green-200',
        button: 'from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800',
        glow: 'shadow-green-500/20'
      },
      [ROLES.VILLAGER]: {
        bg: 'from-slate-900/90 via-gray-800/90 to-slate-900/90',
        border: 'border-slate-400/50',
        title: 'text-slate-300',
        accent: 'text-slate-200',
        button: 'from-slate-600 to-gray-700 hover:from-slate-700 hover:to-gray-800',
        glow: 'shadow-slate-500/20'
      }
    };
    return themes[role] || themes[ROLES.VILLAGER];
  };

  const getRoleDescription = (role) => {
    const descriptions = {
      [ROLES.WEREWOLF]: {
        goal: '消灭所有神民阵营的玩家',
        ability: '夜晚与同伴一起杀人，白天隐藏身份误导好人',
        tips: '注意配合队友，不要暴露身份'
      },
      [ROLES.SEER]: {
        goal: '找出并投票淘汰所有狼人',
        ability: '每晚可以查验一人身份',
        tips: '谨慎地传递信息，避免被狼人发现'
      },
      [ROLES.WITCH]: {
        goal: '协助好人找出狼人',
        ability: '拥有解药和毒药各一瓶',
        tips: '合理使用药剂，关键时刻能扭转局势'
      },
      [ROLES.HUNTER]: {
        goal: '协助好人找出狼人',
        ability: '死亡时可以带走一名玩家',
        tips: '即使死亡也要发挥最后的价值'
      },
      [ROLES.GUARD]: {
        goal: '协助好人找出狼人',
        ability: '每晚守护一人免受狼杀',
        tips: '不能连续两晚守护同一个人'
      },
      [ROLES.VILLAGER]: {
        goal: '协助好人找出狼人',
        ability: '投票淘汰可疑玩家',
        tips: '仔细分析发言，找出真相'
      }
    };
    return descriptions[role] || descriptions[ROLES.VILLAGER];
  };

  const theme = getRoleTheme(humanPlayer.role);
  const roleIcon = getRoleIcon(humanPlayer.role);
  const description = getRoleDescription(humanPlayer.role);

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className={`bg-gradient-to-br ${theme.bg} p-8 rounded-2xl shadow-2xl ${theme.glow} text-center border-2 ${theme.border} max-w-2xl w-full relative overflow-hidden backdrop-filter backdrop-blur-sm`}>
        {/* Atmospheric background */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/20 pointer-events-none"></div>
        
        <div className="relative z-10">
          {/* Role reveal */}
          <div className="mb-8">
            <div className="text-8xl mb-4 animate-bounce">
              {roleIcon}
            </div>
            <h2 className={`text-2xl font-semibold mb-2 ${theme.title}`}>
              你的身份是
            </h2>
            <div className={`text-5xl font-bold ${theme.accent} tracking-wider mb-2 animate-pulse`}>
              {humanPlayer.role}
            </div>
          </div>

          {/* Role information */}
          <div className="text-left space-y-4 mb-8">
            <div className="p-4 bg-black/20 rounded-xl border border-white/10">
              <h3 className={`text-lg font-semibold ${theme.title} mb-2 flex items-center`}>
                <span className="mr-2">🎯</span>
                获胜目标
              </h3>
              <p className={`${theme.accent} leading-relaxed`}>
                {description.goal}
              </p>
            </div>

            <div className="p-4 bg-black/20 rounded-xl border border-white/10">
              <h3 className={`text-lg font-semibold ${theme.title} mb-2 flex items-center`}>
                <span className="mr-2">⚡</span>
                特殊能力
              </h3>
              <p className={`${theme.accent} leading-relaxed`}>
                {description.ability}
              </p>
            </div>

            <div className="p-4 bg-black/20 rounded-xl border border-white/10">
              <h3 className={`text-lg font-semibold ${theme.title} mb-2 flex items-center`}>
                <span className="mr-2">💡</span>
                游戏提示
              </h3>
              <p className={`${theme.accent} leading-relaxed`}>
                {description.tips}
              </p>
            </div>
          </div>

          {/* Continue button */}
          <button 
            onClick={onContinue} 
            className={`action-button px-8 py-4 bg-gradient-to-r ${theme.button} text-white text-xl font-semibold rounded-xl shadow-2xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-white/20`}
          >
            🎮 知道了，进入游戏
          </button>
        </div>

        {/* Decorative elements */}
        <div className="absolute -top-2 -right-2 w-20 h-20 bg-gradient-to-br from-white/10 to-transparent rounded-full pointer-events-none"></div>
        <div className="absolute -bottom-2 -left-2 w-16 h-16 bg-gradient-to-tr from-white/5 to-transparent rounded-full pointer-events-none"></div>
      </div>
    </div>
  );
};

export default RoleModal; 