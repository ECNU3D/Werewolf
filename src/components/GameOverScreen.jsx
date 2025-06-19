import { useLanguage } from '../contexts/LanguageContext';

const GameOverScreen = ({ winner, players, onRestart }) => {
  const { t, tr } = useLanguage();
  
  let winnerMessage, winnerColor;
  
  if (winner === 'WEREWOLVES') {
    winnerMessage = t('gameOver.werewolvesWin');
    winnerColor = 'bg-red-700';
  } else if (winner === 'VILLAGERS') {
    winnerMessage = t('gameOver.villagersWin');
    winnerColor = 'bg-green-600';
  } else {
    winnerMessage = t('gameOver.gameEnd');
    winnerColor = 'bg-gray-700';
  }
  
  return (
    <div className={`min-h-screen ${winnerColor} text-white flex flex-col items-center justify-center p-4`}>
      <h1 className="text-6xl font-bold mb-6 animate-pulse">{winnerMessage}</h1>
      <div className="bg-black bg-opacity-30 p-6 rounded-lg shadow-2xl mb-8 w-full max-w-md text-center">
        <h3 className="text-2xl font-semibold mb-3 border-b pb-2">{t('gameOver.finalRoles')}:</h3>
        {players.map(p => (
          <p key={p.id} className="text-lg">
            {p.name}: <span className="font-semibold">{tr(p.role)}</span>
          </p>
        ))}
      </div>
      <button 
          onClick={onRestart}
          className="px-8 py-4 bg-yellow-500 text-black text-2xl rounded-lg shadow-xl hover:bg-yellow-600 transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-yellow-300 focus:ring-opacity-50"
      >
          {t('gameOver.restart')}
      </button>
    </div>
  );
};

export default GameOverScreen; 