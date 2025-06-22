import { ROLES, GAME_PHASES } from '../constants/gameConstants';
import { useLanguage } from '../contexts/LanguageContext';

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
  const { t } = useLanguage();
  // Get vote count for this player
  const voteCount = Object.values(currentVotes).filter(v => v === player.id).length;
  
  // Determine card styling based on player state and role
  let cardClasses = 'card-enter p-2 sm:p-3 md:p-4 lg:p-5 border-2 rounded-lg sm:rounded-xl shadow-lg sm:shadow-2xl transition-all duration-500 ease-in-out transform hover:scale-105 relative overflow-hidden backdrop-filter backdrop-blur-sm';
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
    cardClasses += ' ring-2 sm:ring-4 ring-purple-500 ring-opacity-75';
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

      {/* Role icon - smaller on mobile */}
      {showRoleIcon && (
        <div className="absolute top-1 right-1 sm:top-2 sm:right-2 text-base sm:text-xl md:text-2xl z-10">
          {roleIcon}
        </div>
      )}

      {/* Player info */}
      <div className="relative z-10">
        {/* Player name and status - compact layout */}
        <div className="mb-1 sm:mb-2">
          <div className="flex items-center justify-between">
            <h3 className={`font-bold text-sm sm:text-base md:text-lg lg:text-xl ${nameColor} tracking-wide truncate pr-6`}>
              {player.name}
              {wolfTeammateIcon && <span className="ml-1">{wolfTeammateIcon}</span>}
              {player.isProtected && player.isAlive && player.role !== ROLES.GUARD && <span className="ml-1">🛡️</span>}
            </h3>
          </div>
          
          {/* Status indicator - more compact */}
          <div className="flex items-center mt-0.5">
            <div className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full mr-1.5 ${player.isAlive ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
            <span className={`font-medium text-xs ${player.isAlive ? 'text-green-300' : 'text-red-400'}`}>
              {player.isAlive ? t('playerCard.alive') : t('playerCard.eliminated')}
            </span>
          </div>
        </div>

        {/* Special role information for human player - compact */}
        {humanPlayer?.role === ROLES.SEER && seerLastCheck?.targetId === player.id && (
          <div className="mb-1 sm:mb-2 p-1.5 sm:p-2 bg-purple-600/30 rounded border border-purple-400/50">
            <span className="text-purple-200 text-xs font-medium">
              {t('playerCard.checkResult')}: {seerLastCheck.targetRole}
            </span>
          </div>
        )}

        {/* Vote count display during voting - compact */}
        {gamePhase === GAME_PHASES.VOTING && player.isAlive && voteCount > 0 && (
          <div className="mb-1 sm:mb-2">
            <span className={`text-xs ${textColor}`}>
              {t('playerCard.voteCount')}: <span className="font-bold text-yellow-400">{voteCount}</span>
            </span>
          </div>
        )}

        {/* Action buttons - much more compact */}
        {humanPlayer?.isAlive && (
          <div className="space-y-1">
            {/* Werewolf attack button */}
            {gamePhase === GAME_PHASES.WEREWOLVES_ACT && humanPlayer.role === ROLES.WEREWOLF && player.isAlive && player.id !== humanPlayer.id && (
              <button 
                onClick={() => onPlayerAction('WEREWOLF_TARGET', player.id)} 
                className="action-button w-full px-1.5 py-1 sm:px-2 sm:py-1.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded font-medium shadow-lg transform transition-all duration-200 text-xs"
              >
                🗡️ <span className="hidden sm:inline">{t('playerCard.buttons.attack')}</span>
              </button>
            )}

            {/* Guard protect button */}
            {gamePhase === GAME_PHASES.GUARD_ACTS && humanPlayer.role === ROLES.GUARD && player.isAlive && player.id !== guardLastProtectedId && (
              <button 
                onClick={() => onPlayerAction('GUARD_PROTECT', player.id)} 
                className="action-button w-full px-1.5 py-1 sm:px-2 sm:py-1.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded font-medium shadow-lg text-xs"
              >
                🛡️ <span className="hidden sm:inline">{t('playerCard.buttons.guard')}</span>
              </button>
            )}

            {/* Seer check button */}
            {gamePhase === GAME_PHASES.SEER_ACTS && humanPlayer.role === ROLES.SEER && player.isAlive && player.id !== humanPlayer.id && (
              <button 
                onClick={() => onPlayerAction('SEER_CHECK', player.id)} 
                className="action-button w-full px-1.5 py-1 sm:px-2 sm:py-1.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded font-medium shadow-lg text-xs"
              >
                🔮 <span className="hidden sm:inline">{t('playerCard.buttons.check')}</span>
              </button>
            )}

            {/* Witch poison button */}
            {gamePhase === GAME_PHASES.WITCH_ACTS_POISON && humanPlayer.role === ROLES.WITCH && witchPotions.poison && player.isAlive && player.id !== humanPlayer.id && (
              <button 
                onClick={() => onPlayerAction('USE_POISON', player.id)} 
                className="action-button w-full px-1.5 py-1 sm:px-2 sm:py-1.5 bg-gradient-to-r from-purple-800 to-purple-900 text-white rounded font-medium shadow-lg text-xs"
              >
                ☠️ <span className="hidden sm:inline">{t('playerCard.buttons.poison')}</span>
              </button>
            )}

            {/* Voting button */}
            {gamePhase === GAME_PHASES.VOTING && player.isAlive && player.id !== humanPlayer.id && !currentVotes[humanPlayer.id] && (
              <button 
                onClick={() => onPlayerAction('VOTE_PLAYER', player.id)} 
                className="action-button w-full px-1.5 py-1 sm:px-2 sm:py-1.5 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black rounded font-medium shadow-lg text-xs"
              >
                🗳️ <span className="hidden sm:inline">{t('playerCard.buttons.vote')}</span>
              </button>
            )}
          </div>
        )}

        {/* Hunter shoot button (when dead) */}
        {gamePhase === GAME_PHASES.HUNTER_MAY_ACT && humanPlayer?.role === ROLES.HUNTER && !humanPlayer.isAlive && player.isAlive && player.id !== humanPlayer.id && 
        (pendingDeathPlayerIds.includes(humanPlayer.id) || (hunterTargetId !== null && humanPlayer.id === players.find(p => p.id === hunterTargetId && p.role === ROLES.HUNTER && !p.isAlive)?.id)) && (
          <button 
            onClick={() => onPlayerAction('HUNTER_SHOOT', player.id)} 
            className="action-button w-full px-1.5 py-1 sm:px-2 sm:py-1.5 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded font-medium shadow-lg text-xs mt-1"
          >
            🏹 <span className="hidden sm:inline">{t('playerCard.buttons.shoot')}</span>
          </button>
        )}
      </div>

      {/* Simplified decorative elements */}
      <div className="absolute -bottom-1 -right-1 w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-white/5 to-transparent rounded-full pointer-events-none"></div>
    </div>
  );
};

export default PlayerCard; 