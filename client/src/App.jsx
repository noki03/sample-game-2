// client/src/App.jsx (Updated)
import { useGameStore } from './store/useGameStore';

function App() {
  const gameState = useGameStore((state) => state.gameState);

  return (
    // Use the class defined in index.css
    <div className="game-container">

      {/* TEMP UI ELEMENTS (will be replaced by panels) */}
      <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 10 }}>
        <h1>C&C Knockoff Prototype</h1>
        <p>Game Tick: {gameState.tick}</p>
        <p>Units on map: {gameState.units.length}</p>
        <p style={{ color: gameState.tick > 0 ? '#00ff88' : '#ff0000' }}>
          Status: {gameState.tick > 0 ? 'Synchronized!' : 'Awaiting Server Tick...'}
        </p>
      </div>

      {/* <GameCanvas /> will render here */}

    </div>
  );
}

export default App;