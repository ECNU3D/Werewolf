import { ROLES, PLAYER_COUNT } from '../constants/gameConstants';
import { useLanguage } from '../contexts/LanguageContext';

const GameInfo = ({ gamePhase, humanPlayer, witchPotions, seerLastCheck }) => {
  const { t, tr, tp } = useLanguage();
  
  // Get phase-specific styling
  const getPhaseColor = (phase) => {
    const phaseKey = phase.toUpperCase();
    if (phaseKey.includes('NIGHT') || phaseKey.includes('WEREWOLF') || phaseKey.includes('GUARD') || phaseKey.includes('SEER') || phaseKey.includes('WITCH')) {
      return 'text-purple-300';
    } else if (phaseKey.includes('DISCUSSION') || phaseKey.includes('VOTING')) {
      return 'text-yellow-300';
    } else if (phaseKey.includes('RESOLUTION') || phaseKey.includes('RESULTS')) {
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
          {t('gameTitle')}
        </h2>
        <div className="text-center mb-4">
          <span className="text-lg text-gray-300">({PLAYER_COUNT}{t('playerCount')})</span>
        </div>
        
        {/* Current phase */}
        <div className="mb-4 p-3 bg-black/20 rounded-lg border border-white/10">
          <div className="flex items-center justify-center">
            <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full mr-3 animate-pulse"></div>
            <span className="text-lg font-medium text-gray-200">{t('gameInfo.currentPhase')}:</span>
          </div>
          <p className={`text-2xl font-bold text-center mt-2 ${getPhaseColor(gamePhase)}`}>
            {tp(gamePhase)}
          </p>
        </div>

        {/* Player role info */}
        {humanPlayer && (
          <div className="mb-4 p-4 bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-xl border border-blue-400/30">
            <div className="flex items-center justify-center mb-2">
              <span className="text-3xl mr-3">{getRoleIcon(humanPlayer.role)}</span>
              <div className="text-center">
                <p className="text-lg text-gray-300">{t('gameInfo.yourRole')}</p>
                <p className="text-2xl font-bold text-blue-200">{tr(humanPlayer.role)}</p>
              </div>
            </div>
            
            <div className="flex items-center justify-center mt-3">
              {humanPlayer.isAlive ? (
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                  <span className="text-green-300 font-semibold text-lg">{t('playerCard.alive')}</span>
                </div>
              ) : (
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-400 rounded-full mr-2"></div>
                  <span className="text-red-400 font-semibold text-lg">{t('playerCard.eliminated')}</span>
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
              {t('gameInfo.potionsStatus')}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className={`p-3 rounded-lg border text-center transition-all duration-300 ${
                witchPotions.antidote 
                  ? 'bg-green-900/40 border-green-400/50 text-green-300' 
                  : 'bg-gray-800/40 border-gray-600/50 text-gray-400'
              }`}>
                <div className="text-2xl mb-1">💚</div>
                <div className="text-sm font-medium">
                  {witchPotions.antidote ? t('gameInfo.antidoteAvailable') : t('gameInfo.antidoteUsed')}
                </div>
              </div>
              <div className={`p-3 rounded-lg border text-center transition-all duration-300 ${
                witchPotions.poison 
                  ? 'bg-purple-900/40 border-purple-400/50 text-purple-300' 
                  : 'bg-gray-800/40 border-gray-600/50 text-gray-400'
              }`}>
                <div className="text-2xl mb-1">☠️</div>
                <div className="text-sm font-medium">
                  {witchPotions.poison ? t('gameInfo.poisonAvailable') : t('gameInfo.poisonUsed')}
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
              {t('gameInfo.seerResult')}
            </h3>
            <div className="text-center p-3 bg-blue-900/30 rounded-lg">
              <p className="text-blue-300">
                {t('common.player')} <span className="font-bold text-white">{seerLastCheck.targetId}</span> {t('gameInfo.checkResult')}
              </p>
              <p className="text-xl font-bold text-blue-100 mt-1">
                {tr(seerLastCheck.targetRole)}
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