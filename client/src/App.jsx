// client/src/App.jsx

import { useGameStore } from './store/useGameStore';
import CommandPanel from './ui/CommandPanel';
import GameCanvas from './ui/GameCanvas';

function App() {
  const gameState = useGameStore((state) => state.gameState);

  return (
    <div className="game-container">

      <GameCanvas />
      <CommandPanel />

      {/* TEMP UI Elements positioned over the canvas */}

      {/* <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 10, backgroundColor: 'rgba(0,0,0,0.5)', padding: '10px' }}>
        <h3 style={{ margin: 0 }}>C&C Knockoff Prototype</h3>
        <p>Tick: {gameState.tick}</p>
        <p>Units: {gameState.units.length}</p>
        <p style={{ color: gameState.tick > 0 ? '#00ff00' : '#ff0000' }}>
          Status: {gameState.tick > 0 ? 'Synchronized!' : 'Awaiting Server Tick...'}
        </p>
      </div> */}

    </div>
  );
}

export default App;