// client/src/App.jsx

import { useGameStore } from './store/useGameStore';
import CommandPanel from './ui/CommandPanel';
import GameCanvas from './ui/GameCanvas';
import VictoryScreen from './ui/VictoryScreen';

function App() {
  return (
    <div className="game-container">
      {/* 1. Resources could also go here in a top bar if you want */}

      {/* 2. The Game World */}
      <GameCanvas />

      {/* 3. The Control Interface */}
      <CommandPanel />

      {/* 4. Overlays */}
      <VictoryScreen />
    </div>
  );
}

export default App;