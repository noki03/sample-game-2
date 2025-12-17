// client/src/App.jsx

import { useGameStore } from './store/useGameStore';
import CommandPanel from './ui/CommandPanel';
import GameCanvas from './ui/GameCanvas';
import VictoryScreen from './ui/VictoryScreen';

function App() {
  return (
    <div className="game-container">
      <GameCanvas />
      <CommandPanel />
    </div>
  );
}

export default App;