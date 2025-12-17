import React from 'react';
import { useGameStore } from '../store/useGameStore';

const VictoryScreen = () => {
    const status = useGameStore(state => state.gameState?.status || 'PLAYING');

    const handleRedeploy = () => {
        window.location.href = window.location.origin;
    };

    if (status === 'PLAYING') return null;

    return (
        <div className="victory-screen-overlay" style={{
            backgroundColor: 'rgba(0,0,0,0.85)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            color: status === 'VICTORY' ? '#00ff00' : '#ff0000',
            fontFamily: '"Consolas", "Monospace", sans-serif',
        }}>
            <h1 style={{
                fontSize: '64px',
                margin: 0,
                textShadow: status === 'VICTORY' ? '0 0 20px #00ff00' : '0 0 20px #ff0000'
            }}>
                {status === 'VICTORY' ? 'MISSION ACCOMPLISHED' : 'MISSION FAILED'}
            </h1>

            <button
                onClick={handleRedeploy}
                style={{
                    marginTop: '40px',
                    padding: '15px 40px',
                    background: 'none',
                    border: '3px solid',
                    borderColor: 'inherit',
                    color: 'inherit',
                    cursor: 'none', // Keep system cursor hidden
                    fontWeight: 'bold',
                    fontSize: '24px',
                    letterSpacing: '2px',
                    zIndex: 10001 // Ensure button is above the overlay background
                }}
            >
                REDEPLOY
            </button>
        </div>
    );
};

export default VictoryScreen;