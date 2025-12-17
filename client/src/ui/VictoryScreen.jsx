import React from 'react';
import { useGameStore } from '../store/useGameStore';

const VictoryScreen = () => {
    const status = useGameStore(state => state.gameState?.status || 'PLAYING');
    // const status = 'VICTORY';

    const handleRedeploy = () => {
        window.location.href = window.location.origin;
    };

    if (status === 'PLAYING') return null;

    const isVictory = status === 'VICTORY';

    return (
        <div className="victory-screen-overlay" style={{
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(4px)', // Makes the background game look out of focus
        }}>
            {/* The Main Title */}
            <h1 style={{
                fontSize: '72px',
                margin: 0,
                color: isVictory ? '#00ff00' : '#ff0000',
                textShadow: isVictory ? '0 0 30px rgba(0,255,0,0.5)' : '0 0 30px rgba(255,0,0,0.5)',
                letterSpacing: '8px',
                textAlign: 'center'
            }}>
                {isVictory ? 'MISSION ACCOMPLISHED' : 'MISSION FAILED'}
            </h1>

            {/* Subtle Subtext */}
            <p style={{
                color: '#aaa',
                marginTop: '10px',
                fontSize: '14px',
                letterSpacing: '4px'
            }}>
                {isVictory ? 'THE SECTOR IS SECURE' : 'CRITICAL ASSETS LOST'}
            </p>

            {/* Redeploy Button */}
            <button
                onClick={handleRedeploy}
                style={{
                    marginTop: '50px',
                    padding: '15px 50px',
                    background: 'none',
                    border: '2px solid',
                    borderColor: isVictory ? '#00ff00' : '#ff0000',
                    color: isVictory ? '#00ff00' : '#ff0000',
                    cursor: 'none', // We use the software cursor from the canvas
                    fontWeight: 'bold',
                    fontSize: '20px',
                    letterSpacing: '3px',
                    transition: '0.3s all',
                    backgroundColor: 'rgba(0,0,0,0.5)'
                }}
                onMouseEnter={(e) => {
                    e.target.style.backgroundColor = isVictory ? 'rgba(0,255,0,0.1)' : 'rgba(255,0,0,0.1)';
                    e.target.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'rgba(0,0,0,0.5)';
                    e.target.style.transform = 'scale(1)';
                }}
            >
                REDEPLOY
            </button>
        </div>
    );
};

export default VictoryScreen;