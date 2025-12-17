// client/src/App.jsx

import CommandPanel from './ui/CommandPanel';
import GameCanvas from './ui/GameCanvas';
import VictoryScreen from './ui/VictoryScreen';

function App() {
  return (
    <div className="game-container">
      <GameCanvas />
      <CommandPanel />
      <VictoryScreen />
    </div>
  );
}

export default App;