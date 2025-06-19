import { useState } from 'react';
import { ROLES, PLAYER_COUNT } from '../constants/gameConstants';

const SetupScreen = ({ onStartGame }) => {
  const [selectedRole, setSelectedRole] = useState(null);
  const [isRandomMode, setIsRandomMode] = useState(true);

  const roleOptions = [
    {
      role: ROLES.WEREWOLF,
      icon: '🐺',
      name: '狼人',
      description: '夜晚杀害好人，白天隐藏身份',
      color: 'from-red-900/80 to-red-800/80',
      border: 'border-red-400/50',
      difficulty: '中等'
    },
    {
      role: ROLES.SEER,
      icon: '🔮',
      name: '预言家',
      description: '每晚查验一人身份',
      color: 'from-blue-900/80 to-purple-800/80',
      border: 'border-blue-400/50',
      difficulty: '困难'
    },
    {
      role: ROLES.WITCH,
      icon: '🧙‍♀️',
      name: '女巫',
      description: '拥有解药和毒药各一瓶',
      color: 'from-purple-900/80 to-pink-800/80',
      border: 'border-purple-400/50',
      difficulty: '困难'
    },
    {
      role: ROLES.HUNTER,
      icon: '🏹',
      name: '猎人',
      description: '死亡时可以带走一名玩家',
      color: 'from-orange-900/80 to-red-800/80',
      border: 'border-orange-400/50',
      difficulty: '简单'
    },
    {
      role: ROLES.GUARD,
      icon: '🛡️',
      name: '守卫',
      description: '每晚守护一人免受狼杀',
      color: 'from-green-900/80 to-emerald-800/80',
      border: 'border-green-400/50',
      difficulty: '中等'
    },
    {
      role: ROLES.VILLAGER,
      icon: '👤',
      name: '平民',
      description: '依靠投票淘汰狼人',
      color: 'from-slate-900/80 to-gray-800/80',
      border: 'border-slate-400/50',
      difficulty: '简单'
    }
  ];

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case '简单':
        return 'text-green-400 bg-green-900/30';
      case '中等':
        return 'text-yellow-400 bg-yellow-900/30';
      case '困难':
        return 'text-red-400 bg-red-900/30';
      default:
        return 'text-gray-400 bg-gray-900/30';
    }
  };

  const handleStartGame = () => {
    const gameConfig = {
      isRandomRole: isRandomMode,
      selectedRole: isRandomMode ? null : selectedRole
    };
    onStartGame(gameConfig);
  };

  return (
    <div className="min-h-screen text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-10 w-4 h-4 bg-purple-400/30 rounded-full animate-pulse"></div>
        <div className="absolute top-20 right-20 w-2 h-2 bg-blue-400/40 rounded-full animate-pulse animation-delay-500"></div>
        <div className="absolute bottom-20 left-20 w-3 h-3 bg-purple-300/20 rounded-full animate-pulse animation-delay-1000"></div>
        <div className="absolute bottom-10 right-10 w-5 h-5 bg-blue-300/20 rounded-full animate-pulse animation-delay-1500"></div>
      </div>

      <div className="relative z-10 text-center max-w-6xl w-full">
        {/* Title */}
        <div className="mb-8">
          <h1 className="game-title text-6xl md:text-7xl font-bold mb-4 tracking-wider">
            狼 人 杀
          </h1>
          <div className="flex items-center justify-center text-xl text-gray-300 mb-2">
            <span className="mr-2">🌙</span>
            <span>经典推理游戏</span>
            <span className="ml-2">🐺</span>
          </div>
          <p className="text-lg text-gray-400">
            {PLAYER_COUNT}人局 | 2狼人 vs 6好人
          </p>
        </div>

        {/* Role selection mode toggle */}
        <div className="mb-8 p-6 bg-gradient-to-r from-gray-900/80 to-purple-900/80 rounded-xl border border-purple-400/30 backdrop-filter backdrop-blur-sm">
          <h2 className="text-2xl font-bold mb-4 text-purple-300">选择游戏模式</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setIsRandomMode(true)}
              className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                isRandomMode 
                  ? 'border-purple-400 bg-purple-900/50 text-purple-200' 
                  : 'border-gray-600 bg-gray-800/50 text-gray-300 hover:border-purple-400/50'
              }`}
            >
              <div className="text-4xl mb-2">🎲</div>
              <h3 className="text-xl font-semibold mb-2">随机分配</h3>
              <p className="text-sm opacity-80">系统随机为你分配一个角色</p>
            </button>
            <button
              onClick={() => setIsRandomMode(false)}
              className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                !isRandomMode 
                  ? 'border-purple-400 bg-purple-900/50 text-purple-200' 
                  : 'border-gray-600 bg-gray-800/50 text-gray-300 hover:border-purple-400/50'
              }`}
            >
              <div className="text-4xl mb-2">🎯</div>
              <h3 className="text-xl font-semibold mb-2">选择角色</h3>
              <p className="text-sm opacity-80">自己选择想要扮演的角色</p>
            </button>
          </div>
        </div>

        {/* Role selection grid (only shown when not in random mode) */}
        {!isRandomMode && (
          <div className="mb-8 p-6 bg-gradient-to-r from-gray-900/80 to-blue-900/80 rounded-xl border border-blue-400/30 backdrop-filter backdrop-blur-sm">
            <h2 className="text-2xl font-bold mb-6 text-blue-300">选择你的角色</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {roleOptions.map((roleOption) => (
                <button
                  key={roleOption.role}
                  onClick={() => setSelectedRole(roleOption.role)}
                  className={`p-6 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 ${
                    selectedRole === roleOption.role
                      ? `${roleOption.border} bg-gradient-to-br ${roleOption.color}`
                      : 'border-gray-600 bg-gray-800/50 hover:border-gray-400'
                  }`}
                >
                  <div className="text-5xl mb-3">{roleOption.icon}</div>
                  <h3 className="text-xl font-bold mb-2">{roleOption.name}</h3>
                  <p className="text-sm text-gray-300 mb-3 leading-relaxed">
                    {roleOption.description}
                  </p>
                  <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(roleOption.difficulty)}`}>
                    {roleOption.difficulty}
                  </div>
                </button>
              ))}
            </div>
            {selectedRole && (
              <div className="mt-6 p-4 bg-green-900/30 rounded-lg border border-green-400/30">
                <p className="text-green-300 font-medium">
                  ✅ 已选择: {roleOptions.find(r => r.role === selectedRole)?.name}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Start button */}
        <div className="relative">
          <button 
            onClick={handleStartGame}
            disabled={!isRandomMode && !selectedRole}
            className={`action-button px-12 py-6 text-3xl font-bold rounded-2xl shadow-2xl transition-all duration-300 transform focus:outline-none focus:ring-4 focus:ring-purple-400/50 ${
              (!isRandomMode && !selectedRole)
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
                : 'bg-gradient-to-r from-purple-600 via-purple-700 to-blue-600 text-white hover:from-purple-700 hover:via-purple-800 hover:to-blue-700 hover:scale-110'
            }`}
          >
            🎮 开始游戏
          </button>
          
          {/* Glowing effect */}
          {(isRandomMode || selectedRole) && (
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-purple-700 to-blue-600 rounded-2xl blur-xl opacity-30 -z-10 animate-pulse"></div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-8 p-4 bg-gray-900/50 rounded-xl border border-gray-700/50 max-w-2xl mx-auto">
          <p className="text-sm text-gray-400 leading-relaxed">
            {isRandomMode 
              ? '💡 系统将随机为你分配一个角色，增加游戏的不确定性和挑战性！'
              : '💡 选择你想要扮演的角色，体验不同的游戏策略和玩法！'
            }
          </p>
        </div>
      </div>

      {/* Decorative corner elements */}
      <div className="absolute top-4 left-4 w-12 h-12 border-l-2 border-t-2 border-purple-400/30 rounded-tl-2xl"></div>
      <div className="absolute top-4 right-4 w-12 h-12 border-r-2 border-t-2 border-purple-400/30 rounded-tr-2xl"></div>
      <div className="absolute bottom-4 left-4 w-12 h-12 border-l-2 border-b-2 border-purple-400/30 rounded-bl-2xl"></div>
      <div className="absolute bottom-4 right-4 w-12 h-12 border-r-2 border-b-2 border-purple-400/30 rounded-br-2xl"></div>
    </div>
  );
};

export default SetupScreen; 