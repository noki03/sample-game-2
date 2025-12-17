// client/src/ui/CommandPanel.jsx

import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { sendCommand } from '../network/SocketManager';
import { UNIT_STATS, BUILDING_STATS } from '../game/constants';

const CommandPanel = () => {
    const gameState = useGameStore(state => state.gameState);
    const { units, buildings, selectedUnitIds } = gameState;
    const selfId = useGameStore(state => state.getSelfPlayerId());

    // Find the current player's data
    const player = gameState.players.find(p => p.id === selfId);
    if (!player) return null;

    // --- Context Logic ---
    const selectedEntities = [...units, ...buildings].filter(e => selectedUnitIds.includes(e.id));

    const hasBuilder = selectedEntities.some(e => e.type === 'builder');
    const selectedBarracks = selectedEntities.find(e => e.type === 'barracks');
    const selectedWarFactory = selectedEntities.find(e => e.type === 'war_factory');

    // --- Action Handlers ---
    const handlePlaceBuilding = (type) => {
        const stats = BUILDING_STATS[type];
        if (player.resources.money < stats.cost) return alert("Insufficient Funds!");

        // This sets a global "placement mode" in your store so the next Canvas click places it
        // For now, we'll trigger a simplified command or you can use a state for ghost-placement
        useGameStore.getState().setPlacementMode(type);
    };

    const handleTrainUnit = (unitType, buildingId) => {
        const stats = UNIT_STATS[unitType];
        if (player.resources.money < stats.cost) return alert("Insufficient Funds!");

        sendCommand('BUILD_UNIT', {
            unitType,
            buildingId
        });
    };

    return (
        <div style={styles.panel}>
            {/* 1. Resources & Power */}
            <div style={styles.resourceSection}>
                <h2 style={{ color: '#00ff00', margin: 0 }}>${Math.floor(player.resources.money)}</h2>
                <div style={{ fontSize: '12px', marginTop: '5px' }}>
                    <div style={{ color: player.resources.power >= 0 ? '#aaa' : '#ff4444' }}>
                        ⚡ POWER: {player.resources.power}
                    </div>
                </div>
            </div>

            {/* 2. Contextual Menus */}
            <div style={styles.buttonArea}>
                {/* NEW: Selection Identity Header */}
                {selectedEntities.length === 1 && (
                    <div style={{ position: 'absolute', top: '-25px', left: '200px', background: '#00ff00', color: '#000', padding: '2px 10px', fontWeight: 'bold', fontSize: '12px', borderRadius: '3px 3px 0 0' }}>
                        {selectedEntities[0].type.replace('_', ' ').toUpperCase()}
                    </div>
                )}
                {/* BUILDER MENU */}
                {hasBuilder && (
                    <div style={styles.menuGroup}>
                        <span style={styles.label}>STRUCTURES:</span>
                        <button style={styles.btn} onClick={() => handlePlaceBuilding('supply_center')}>
                            Supply Center (${BUILDING_STATS.supply_center.cost})
                        </button>
                        <button style={styles.btn} onClick={() => handlePlaceBuilding('power_generator')}>
                            Power Gen (${BUILDING_STATS.power_generator.cost})
                        </button>
                        <button style={styles.btn} onClick={() => handlePlaceBuilding('barracks')}>
                            Barracks (${BUILDING_STATS.barracks.cost})
                        </button>
                        <button style={styles.btn} onClick={() => handlePlaceBuilding('war_factory')}>
                            War Factory (${BUILDING_STATS.war_factory.cost})
                        </button>
                    </div>
                )}

                {/* BARRACKS MENU */}
                {selectedBarracks && (
                    <div style={styles.menuGroup}>
                        <span style={styles.label}>INFANTRY:</span>
                        <button style={styles.btn} onClick={() => handleTrainUnit('ranger', selectedBarracks.id)}>
                            Train Ranger ($200)
                        </button>
                    </div>
                )}

                {/* WAR FACTORY MENU */}
                {selectedWarFactory && (
                    <div style={styles.menuGroup}>
                        <span style={styles.label}>VEHICLES:</span>
                        <button style={styles.btn} onClick={() => handleTrainUnit('crusader', selectedWarFactory.id)}>
                            Build Crusader ($800)
                        </button>
                    </div>
                )}

                {!hasBuilder && !selectedBarracks && !selectedWarFactory && (
                    <div style={{ color: '#555', fontStyle: 'italic', paddingTop: '15px' }}>
                        Select a unit or building to see options
                    </div>
                )}
            </div>
        </div>
    );
};

const styles = {
    panel: {
        position: 'fixed', // Fixed to the bottom of the viewport
        bottom: 0,
        left: 0,
        width: '100%',
        height: '180px',
        backgroundColor: '#151515',
        borderTop: '3px solid #00ff00',
        display: 'flex',
        padding: '10px 20px',
        color: '#fff',
        zIndex: 1000, // High z-index to stay above everything
        boxSizing: 'border-box',
    },
    resourceSection: {
        width: '180px',
        borderRight: '2px solid #333',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
    },
    buttonArea: {
        flex: 1,
        paddingLeft: '20px',
        display: 'flex',
        alignItems: 'flex-start',
        overflowX: 'auto' // Allow scrolling if too many menus open
    },
    menuGroup: {
        display: 'flex',
        flexDirection: 'row', // Change to Row so buttons sit side-by-side
        flexWrap: 'wrap',     // Wrap to next line if there are many
        gap: '10px',
        alignContent: 'flex-start'
    },
    label: {
        display: 'block',
        width: '100%', // Force label to take own line
        fontSize: '11px',
        fontWeight: 'bold',
        color: '#00ff00',
        marginBottom: '5px',
        textTransform: 'uppercase'
    },
    btn: {
        background: '#2a2a2a',
        color: '#eee',
        border: '1px solid #555',
        padding: '12px 15px',
        cursor: 'pointer',
        fontSize: '12px',
        fontWeight: 'bold',
        minWidth: '140px',
        transition: '0.1s',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
    }
};

export default CommandPanel;