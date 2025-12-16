// client/src/ui/CommandPanel.jsx

import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { sendCommand } from '../network/SocketManager';
import { UNIT_STATS } from '../game/constants';

const CommandPanel = () => {
    const gameState = useGameStore(state => state.gameState);
    const selfId = useGameStore(state => state.getSelfPlayerId());

    // Find the current player's data
    const player = gameState.players.find(p => p.id === selfId);

    const handleBuildUnit = (unitType) => {
        const cost = UNIT_STATS[unitType].cost;

        if (player.resources.money >= cost) {
            sendCommand('BUILD_UNIT', {
                unitType: unitType,
                buildingId: 501 // For the prototype, we assume training at the Outpost
            });
        } else {
            alert("Insufficient Funds!");
        }
    };

    if (!player) return null;

    return (
        <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '120px',
            backgroundColor: 'rgba(20, 20, 20, 0.9)',
            borderTop: '3px solid #555',
            display: 'flex',
            padding: '10px',
            color: '#fff',
            zIndex: 100
        }}>
            {/* Resource Section */}
            <div style={{ width: '200px', borderRight: '1px solid #444' }}>
                <h2 style={{ color: '#00ff00' }}>${Math.floor(player.resources.money)}</h2>
                <p style={{ fontSize: '12px' }}>INCOME: +{player.resources.incomeRate}/tick</p>
            </div>

            {/* Production Section */}
            <div style={{ flex: 1, paddingLeft: '20px', display: 'flex', gap: '10px' }}>
                <button
                    onClick={() => handleBuildUnit('ranger')}
                    className="build-btn"
                >
                    Train Ranger ($200)
                </button>
                <button
                    onClick={() => handleBuildUnit('crusader')}
                    className="build-btn"
                >
                    Build Crusader ($700)
                </button>
            </div>

            <style>{`
                .build-btn {
                    background: #333;
                    color: #ccc;
                    border: 2px solid #555;
                    padding: 10px 20px;
                    cursor: pointer;
                    font-weight: bold;
                    transition: 0.2s;
                }
                .build-btn:hover {
                    background: #444;
                    border-color: #00ff00;
                    color: #fff;
                }
            `}</style>
        </div>
    );
};

export default CommandPanel;