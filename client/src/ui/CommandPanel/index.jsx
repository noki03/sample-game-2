import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { sendCommand } from '../../network/SocketManager';
import { BUILDING_STATS } from '../../game/constants';
import { styles } from './styles';
import ProductionButton from './ProductionButton';

const CommandPanel = () => {
    const gameState = useGameStore(state => state.gameState);
    const notification = useGameStore(state => state.notification);
    const setNotification = useGameStore(state => state.setNotification);
    const selfId = useGameStore(state => state.getSelfPlayerId());

    const player = gameState?.players.find(p => p.id === selfId);
    if (!player) return null;

    const { units, buildings, selectedUnitIds } = gameState;
    const selectedEntities = [...units, ...buildings].filter(e => selectedUnitIds.includes(e.id));
    const activeBuilding = buildings.find(b => selectedUnitIds.includes(b.id) && b.ownerId === selfId);
    const hasBuilder = selectedEntities.some(e => e.type === 'builder');

    // --- Logic Handlers ---
    const handleAction = (type, cost, callback) => {
        if (player.resources.money < cost) {
            return setNotification ? setNotification("INSUFFICIENT FUNDS") : alert("Insufficient Funds!");
        }
        callback();
    };

    const handleCancelUnit = (buildingId, unitType) => {
        const b = buildings.find(b => b.id === buildingId);
        const idx = b?.queue.findIndex(item => item.type === unitType);
        if (idx !== -1) sendCommand('CANCEL_PRODUCTION', { buildingId, index: idx });
    };

    return (
        <div style={styles.panel} className="command-panel">
            {notification && <div style={styles.notificationOverlay} className="notification-pulse">⚠️ {notification}</div>}

            {selectedEntities.length === 1 && (
                <div style={styles.contextLabel}>{selectedEntities[0].type.replace('_', ' ').toUpperCase()}</div>
            )}

            {/* Resources Section */}
            <div style={styles.resourceSection}>
                <h2 style={{ color: '#00ff00', margin: 0 }}>${Math.floor(player.resources.money)}</h2>
                <div style={{ fontSize: '12px', marginTop: '5px' }}>
                    <div style={{ color: player.resources.power >= 0 ? '#aaa' : '#ff4444' }}>⚡ POWER: {player.resources.power}</div>
                </div>
            </div>

            {/* Action Area */}
            <div style={styles.buttonArea}>
                {hasBuilder && (
                    <div style={styles.menuGroup}>
                        <span style={styles.label}>STRUCTURES</span>
                        {Object.keys(BUILDING_STATS).map(type => (
                            <button key={type} style={styles.btn} onClick={() => handleAction(type, BUILDING_STATS[type].cost, () => useGameStore.getState().setPlacementMode(type))}>
                                {type.replace('_', ' ').toUpperCase()} (${BUILDING_STATS[type].cost})
                            </button>
                        ))}
                    </div>
                )}

                {activeBuilding?.type === 'barracks' && (
                    <div style={styles.menuGroup}>
                        <span style={styles.label}>INFANTRY</span>
                        <ProductionButton unitType="ranger" building={activeBuilding} onCancel={handleCancelUnit} onTrain={(type, id) => handleAction(type, 50, () => sendCommand('BUILD_UNIT', { unitType: type, buildingId: id }))} />
                    </div>
                )}

                {activeBuilding?.type === 'war_factory' && (
                    <div style={styles.menuGroup}>
                        <span style={styles.label}>VEHICLES</span>
                        <ProductionButton unitType="crusader" building={activeBuilding} onCancel={handleCancelUnit} onTrain={(type, id) => handleAction(type, 200, () => sendCommand('BUILD_UNIT', { unitType: type, buildingId: id }))} />
                    </div>
                )}

                {activeBuilding && (
                    <div style={styles.managementGroup}>
                        <span style={styles.label}>OPTIONS</span>
                        <button style={{ ...styles.btn, color: activeBuilding.status === 'CONSTRUCTING' ? '#ffcc00' : '#ff4444' }}
                            onClick={() => activeBuilding.status === 'CONSTRUCTING' ? sendCommand('CANCEL_BUILDING', { buildingId: activeBuilding.id }) : window.confirm("Sell for 50%?") && sendCommand('SELL_BUILDING', { buildingId: activeBuilding.id })}>
                            {activeBuilding.status === 'CONSTRUCTING' ? 'CANCEL (100%)' : 'SELL (50%)'}
                        </button>
                    </div>
                )}

                {selectedEntities.length === 0 && <div style={{ color: '#555', fontStyle: 'italic', alignSelf: 'center' }}>Select a unit or building to see options</div>}
            </div>
        </div>
    );
};

export default CommandPanel;