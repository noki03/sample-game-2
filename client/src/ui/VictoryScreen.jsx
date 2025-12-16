// src/ui/VictoryScreen.jsx

import React from 'react';
import { useGameStore } from '../store/useGameStore';

const VictoryScreen = () => {
    const status = useGameStore(state => state.gameState.status);
    const handleRedeploy = () => {
        // Option A: Hard refresh (Brute force, but reliable)
        window.location.href = window.location.origin;

        // Option B: If you want to keep the socket connection:
        // sendCommand('RESTART_GAME', {}); 
    };
    if (status === 'PLAYING') return null;

    return (
        <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column',
            justifyContent: 'center', alignItems: 'center', zIndex: 1000,
            color: status === 'VICTORY' ? '#00ff00' : '#ff0000',
            fontFamily: 'monospace'
        }}>
            <h1 style={{ fontSize: '64px', margin: 0 }}>
                {status === 'VICTORY' ? 'MISSION ACCOMPLISHED' : 'MISSION FAILED'}
            </h1>
            <button
                onClick={handleRedeploy}
                style={{
                    marginTop: '20px', padding: '15px 30px', background: 'none',
                    border: '2px solid', borderColor: 'inherit', color: 'inherit',
                    cursor: 'pointer', fontWeight: 'bold', fontSize: '20px'
                }}
            >
                REDEPLOY
            </button>
        </div>
    );
};

export default VictoryScreen;