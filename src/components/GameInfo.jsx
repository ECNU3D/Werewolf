import { ROLES, PLAYER_COUNT } from '../constants/gameConstants';

const GameInfo = ({ gamePhase, humanPlayer, witchPotions, seerLastCheck }) => {
  // Get phase-specific styling
  const getPhaseColor = (phase) => {
    if (phase.includes('夜晚') || phase.includes('狼人') || phase.includes('守卫') || phase.includes('预言家') || phase.includes('女巫')) {
      return 'text-purple-300';
    } else if (phase.includes('讨论') || phase.includes('投票')) {
      return 'text-yellow-300';
    } else if (phase.includes('结算') || phase.includes('结果')) {
      return 'text-red-300';
    }
    return 'text-blue-300';
  };

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

  return (
    <div className="phase-indicator relative">
      {/* Atmospheric background elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-purple-900/20 rounded-xl pointer-events-none"></div>
      
      <div className="relative z-10">
        <h2 className="game-title text-4xl font-bold mb-4 text-center">
          狼人杀
        </h2>
        <div className="text-center mb-4">
          <span className="text-lg text-gray-300">({PLAYER_COUNT}人局)</span>
        </div>
        
        {/* Current phase */}
        <div className="mb-4 p-3 bg-black/20 rounded-lg border border-white/10">
          <div className="flex items-center justify-center">
            <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full mr-3 animate-pulse"></div>
            <span className="text-lg font-medium text-gray-200">当前阶段:</span>
          </div>
          <p className={`text-2xl font-bold text-center mt-2 ${getPhaseColor(gamePhase)}`}>
            {gamePhase}
          </p>
        </div>

        {/* Player role info */}
        {humanPlayer && (
          <div className="mb-4 p-4 bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-xl border border-blue-400/30">
            <div className="flex items-center justify-center mb-2">
              <span className="text-3xl mr-3">{getRoleIcon(humanPlayer.role)}</span>
              <div className="text-center">
                <p className="text-lg text-gray-300">你的身份</p>
                <p className="text-2xl font-bold text-blue-200">{humanPlayer.role}</p>
              </div>
            </div>
            
            <div className="flex items-center justify-center mt-3">
              {humanPlayer.isAlive ? (
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                  <span className="text-green-300 font-semibold text-lg">存活</span>
                </div>
              ) : (
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-400 rounded-full mr-2"></div>
                  <span className="text-red-400 font-semibold text-lg">已淘汰</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Witch potions info */}
        {humanPlayer?.role === ROLES.WITCH && (
          <div className="mb-4 p-4 bg-gradient-to-r from-purple-900/40 to-pink-900/40 rounded-xl border border-purple-400/30">
            <h3 className="text-lg font-semibold text-purple-200 mb-3 text-center flex items-center justify-center">
              <span className="mr-2">🧪</span>
              药剂状态
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className={`p-3 rounded-lg border text-center transition-all duration-300 ${
                witchPotions.antidote 
                  ? 'bg-green-900/40 border-green-400/50 text-green-300' 
                  : 'bg-gray-800/40 border-gray-600/50 text-gray-400'
              }`}>
                <div className="text-2xl mb-1">💚</div>
                <div className="text-sm font-medium">
                  {witchPotions.antidote ? '解药可用' : '解药已用'}
                </div>
              </div>
              <div className={`p-3 rounded-lg border text-center transition-all duration-300 ${
                witchPotions.poison 
                  ? 'bg-purple-900/40 border-purple-400/50 text-purple-300' 
                  : 'bg-gray-800/40 border-gray-600/50 text-gray-400'
              }`}>
                <div className="text-2xl mb-1">☠️</div>
                <div className="text-sm font-medium">
                  {witchPotions.poison ? '毒药可用' : '毒药已用'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Seer last check info */}
        {seerLastCheck && humanPlayer?.role === ROLES.SEER && (
          <div className="p-4 bg-gradient-to-r from-blue-900/40 to-indigo-900/40 rounded-xl border border-blue-400/30">
            <h3 className="text-lg font-semibold text-blue-200 mb-2 text-center flex items-center justify-center">
              <span className="mr-2">🔮</span>
              查验记录
            </h3>
            <div className="text-center p-3 bg-blue-900/30 rounded-lg">
              <p className="text-blue-300">
                玩家 <span className="font-bold text-white">{seerLastCheck.targetId}</span> 的身份是
              </p>
              <p className="text-xl font-bold text-blue-100 mt-1">
                {seerLastCheck.targetRole}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Decorative corner elements */}
      <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-purple-400/50 rounded-tl-lg"></div>
      <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-purple-400/50 rounded-tr-lg"></div>
      <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-purple-400/50 rounded-bl-lg"></div>
      <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-purple-400/50 rounded-br-lg"></div>
    </div>
  );
};

export default GameInfo; 