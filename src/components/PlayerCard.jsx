import { ROLES, GAME_PHASES } from '../constants/gameConstants';

// Role icons mapping
const ROLE_ICONS = {
  [ROLES.WEREWOLF]: '🐺',
  [ROLES.SEER]: '🔮',
  [ROLES.WITCH]: '🧙‍♀️',
  [ROLES.HUNTER]: '🏹',
  [ROLES.GUARD]: '🛡️',
  [ROLES.VILLAGER]: '👤',
};

const PlayerCard = ({ 
  player, 
  humanPlayer, 
  gamePhase, 
  currentPlayerSpeakingId, 
  werewolfTargetId, 
  seerLastCheck,
  guardLastProtectedId,
  witchPotions,
  currentVotes,
  pendingDeathPlayerIds,
  hunterTargetId,
  players,
  onPlayerAction 
}) => {
  // Get vote count for this player
  const voteCount = Object.values(currentVotes).filter(v => v === player.id).length;
  
  // Determine card styling based on player state and role
  let cardClasses = 'card-enter p-5 border-2 rounded-xl shadow-2xl transition-all duration-500 ease-in-out transform hover:scale-105 relative overflow-hidden backdrop-filter backdrop-blur-sm';
  let textColor = 'text-gray-100';
  let nameColor = 'text-white';
  let wolfTeammateIcon = '';
  
  // Base card styling
  if (!player.isAlive) {
    cardClasses += ' dead-card';
    textColor = 'text-gray-400';
    nameColor = 'text-gray-500';
  } else if (player.isHuman) {
    cardClasses += ' bg-gradient-to-br from-blue-600/90 to-blue-800/90 border-blue-400';
    nameColor = 'text-blue-100';
  } else {
    // AI players get role-based styling if their role is revealed or if human is werewolf teammate
    const isWerewolfTeammate = humanPlayer?.role === ROLES.WEREWOLF && player.role === ROLES.WEREWOLF && player.id !== humanPlayer.id;
    if (isWerewolfTeammate || !player.isAlive) {
      if (player.role === ROLES.WEREWOLF) {
        cardClasses += ' werewolf-card';
      } else {
        cardClasses += ' villager-card';
      }
    } else {
      cardClasses += ' bg-gradient-to-br from-slate-600/90 to-slate-800/90 border-slate-500';
    }
  }

  // Special state styling
  if (gamePhase === GAME_PHASES.DISCUSSION && currentPlayerSpeakingId === player.id && player.isAlive) {
    cardClasses += ' speaking-card';
  }

  if (werewolfTargetId === player.id && gamePhase === GAME_PHASES.WEREWOLVES_ACT) {
    cardClasses += ' targeted-card';
  }

  if (seerLastCheck?.targetId === player.id && gamePhase === GAME_PHASES.SEER_ACTS && humanPlayer?.role === ROLES.SEER) {
    cardClasses += ' ring-4 ring-purple-500 ring-opacity-75';
  }

  if (player.isProtected && player.isAlive) {
    cardClasses += ' protected-card';
  }

  // Show werewolf teammate indicator
  if (humanPlayer?.role === ROLES.WEREWOLF && player.role === ROLES.WEREWOLF && player.id !== humanPlayer.id && player.isAlive) {
    wolfTeammateIcon = '🐺';
  }

  // Get role icon
  const roleIcon = ROLE_ICONS[player.role] || '❓';
  const showRoleIcon = !player.isAlive || (humanPlayer?.role === ROLES.WEREWOLF && player.role === ROLES.WEREWOLF);

  return (
    <div className={cardClasses}>
      {/* Atmospheric background overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-black/10 to-black/30 pointer-events-none"></div>
      
      {/* Vote counter */}
      {gamePhase === GAME_PHASES.VOTING && voteCount > 0 && (
        <div className="vote-counter">
          {voteCount}
        </div>
      )}

      {/* Role icon */}
      {showRoleIcon && (
        <div className="role-icon">
          {roleIcon}
        </div>
      )}

      {/* Player info */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <h3 className={`font-bold text-xl ${nameColor} tracking-wide`}>
            {player.name}
            {wolfTeammateIcon && <span className="ml-2">{wolfTeammateIcon}</span>}
            {player.isProtected && player.isAlive && player.role !== ROLES.GUARD && <span className="ml-2">🛡️</span>}
          </h3>
        </div>

        {/* Status */}
        <div className="mb-3">
          {player.isAlive ? (
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
              <span className="text-green-300 font-medium">存活</span>
            </div>
          ) : (
            <div className="flex items-center">
              <div className="w-2 h-2 bg-red-400 rounded-full mr-2"></div>
              <span className="text-red-400 font-medium">
                已淘汰 ({player.revealedRole || '未知身份'})
              </span>
            </div>
          )}
        </div>

        {/* Special role information for human player */}
        {humanPlayer?.role === ROLES.SEER && seerLastCheck?.targetId === player.id && (
          <div className="mb-3 p-2 bg-purple-600/30 rounded-lg border border-purple-400/50">
            <span className="text-purple-200 text-sm font-medium">
              查验结果: {seerLastCheck.targetRole}
            </span>
          </div>
        )}

        {/* Vote count display during voting */}
        {gamePhase === GAME_PHASES.VOTING && player.isAlive && (
          <div className="mb-3">
            <span className={`text-sm ${textColor}`}>
              被投票数: <span className="font-bold text-yellow-400">{voteCount}</span>
            </span>
          </div>
        )}

        {/* Action buttons */}
        {humanPlayer?.isAlive && (
          <div className="space-y-2">
            {/* Werewolf attack button */}
            {gamePhase === GAME_PHASES.WEREWOLVES_ACT && humanPlayer.role === ROLES.WEREWOLF && player.isAlive && player.id !== humanPlayer.id && (
              <button 
                onClick={() => onPlayerAction('WEREWOLF_TARGET', player.id)} 
                className="action-button w-full px-3 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 font-medium shadow-lg transform transition-all duration-200"
              >
                🗡️ 攻击
              </button>
            )}

            {/* Guard protect button */}
            {gamePhase === GAME_PHASES.GUARD_ACTS && humanPlayer.role === ROLES.GUARD && player.isAlive && player.id !== guardLastProtectedId && (
              <button 
                onClick={() => onPlayerAction('GUARD_PROTECT', player.id)} 
                className="action-button w-full px-3 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 font-medium shadow-lg"
              >
                🛡️ 守护
              </button>
            )}

            {/* Seer check button */}
            {gamePhase === GAME_PHASES.SEER_ACTS && humanPlayer.role === ROLES.SEER && player.isAlive && player.id !== humanPlayer.id && (
              <button 
                onClick={() => onPlayerAction('SEER_CHECK', player.id)} 
                className="action-button w-full px-3 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 font-medium shadow-lg"
              >
                🔮 查验
              </button>
            )}

            {/* Witch poison button */}
            {gamePhase === GAME_PHASES.WITCH_ACTS_POISON && humanPlayer.role === ROLES.WITCH && witchPotions.poison && player.isAlive && player.id !== humanPlayer.id && (
              <button 
                onClick={() => onPlayerAction('USE_POISON', player.id)} 
                className="action-button w-full px-3 py-2 bg-gradient-to-r from-purple-800 to-purple-900 text-white rounded-lg hover:from-purple-900 hover:to-purple-800 font-medium shadow-lg"
              >
                ☠️ 毒杀
              </button>
            )}

            {/* Voting button */}
            {gamePhase === GAME_PHASES.VOTING && player.isAlive && player.id !== humanPlayer.id && !currentVotes[humanPlayer.id] && (
              <button 
                onClick={() => onPlayerAction('VOTE_PLAYER', player.id)} 
                className="action-button w-full px-3 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black rounded-lg hover:from-yellow-600 hover:to-yellow-700 font-medium shadow-lg"
              >
                🗳️ 投票
              </button>
            )}
          </div>
        )}

        {/* Hunter shoot button (when dead) */}
        {gamePhase === GAME_PHASES.HUNTER_MAY_ACT && humanPlayer?.role === ROLES.HUNTER && !humanPlayer.isAlive && player.isAlive && player.id !== humanPlayer.id && 
        (pendingDeathPlayerIds.includes(humanPlayer.id) || (hunterTargetId !== null && humanPlayer.id === players.find(p => p.id === hunterTargetId && p.role === ROLES.HUNTER && !p.isAlive)?.id)) && (
          <button 
            onClick={() => onPlayerAction('HUNTER_SHOOT', player.id)} 
            className="action-button w-full px-3 py-2 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg hover:from-orange-700 hover:to-orange-800 font-medium shadow-lg"
          >
            🏹 射杀
          </button>
        )}
      </div>

      {/* Decorative elements */}
      <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-gradient-to-br from-white/5 to-transparent rounded-full pointer-events-none"></div>
      <div className="absolute -top-2 -left-2 w-8 h-8 bg-gradient-to-br from-white/10 to-transparent rounded-full pointer-events-none"></div>
    </div>
  );
};

export default PlayerCard; 