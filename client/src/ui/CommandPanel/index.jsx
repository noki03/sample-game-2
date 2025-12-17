import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { sendCommand } from '../../network/SocketManager';
import { BUILDING_STATS, UNIT_STATS } from '../../game/constants';
import { styles } from './styles';
import ProductionButton from './ProductionButton';

const CommandPanel = () => {
    const gameState = useGameStore(state => state.gameState);
    const { notification, setNotification, pendingAction, setPendingAction, clearPendingAction } = useGameStore();
    const selfId = useGameStore(state => state.getSelfPlayerId());

    const player = gameState?.players.find(p => p.id === selfId);
    if (!player) return null;

    const { units, buildings, selectedUnitIds } = gameState;
    const selectedEntities = [...units, ...buildings].filter(e => selectedUnitIds.includes(e.id));
    const activeBuilding = buildings.find(b => selectedUnitIds.includes(b.id) && b.ownerId === selfId);
    const hasBuilder = selectedEntities.some(e => e.type === 'builder');

    // --- Unified Action Handler (Replaces alerts) ---
    const handleAction = (type, cost, callback) => {
        if (player.resources.money < cost) {
            return setNotification("INSUFFICIENT FUNDS");
        }
        callback();
    };

    // --- Confirmation Handler (Replaces window.confirm) ---
    const requestSell = (building) => {
        setPendingAction({
            message: `SELL FOR $${Math.floor(BUILDING_STATS[building.type].cost * 0.5)}?`,
            onConfirm: () => {
                sendCommand('SELL_BUILDING', { buildingId: building.id });
                clearPendingAction();
            }
        });
    };

    const handleCancelUnit = (buildingId, unitType) => {
        const b = buildings.find(b => b.id === buildingId);
        const idx = b?.queue.findIndex(item => item.type === unitType);
        if (idx !== -1) sendCommand('CANCEL_PRODUCTION', { buildingId, index: idx });
    };

    return (
        <div style={styles.panel} className="command-panel">
            {/* 1. Notification Overlay */}
            {notification && <div style={styles.notificationOverlay} className="notification-pulse">⚠️ {notification}</div>}

            {/* 2. Confirmation Overlay (RTS Style) */}
            {pendingAction && (
                <div style={styles.confirmOverlay}>
                    <span style={{ color: '#ff4444', fontWeight: 'bold' }}>{pendingAction.message}</span>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                        <button style={styles.confirmBtn} onClick={pendingAction.onConfirm}>YES</button>
                        <button style={styles.cancelBtn} onClick={clearPendingAction}>NO</button>
                    </div>
                </div>
            )}

            {/* Context Label */}
            {selectedEntities.length === 1 && !pendingAction && (
                <div style={styles.contextLabel}>{selectedEntities[0].type.replace('_', ' ').toUpperCase()}</div>
            )}

            {/* Resource Display */}
            <div style={styles.resourceSection}>
                <h2 style={{ color: '#00ff00', margin: 0 }}>${Math.floor(player.resources.money)}</h2>
                <div style={{ fontSize: '12px', marginTop: '5px' }}>
                    <div style={{ color: player.resources.power >= 0 ? '#aaa' : '#ff4444' }}>⚡ POWER: {player.resources.power}</div>
                </div>
            </div>

            {/* Action Area */}
            <div style={styles.buttonArea}>
                {hasBuilder && !pendingAction && (
                    <div style={styles.menuGroup}>
                        <span style={styles.label}>STRUCTURES</span>
                        {Object.keys(BUILDING_STATS).map(type => (
                            <button key={type} style={styles.btn} onClick={() => handleAction(type, BUILDING_STATS[type].cost, () => useGameStore.getState().setPlacementMode(type))}>
                                {type.replace('_', ' ').toUpperCase()} (${BUILDING_STATS[type].cost})
                            </button>
                        ))}
                    </div>
                )}

                {activeBuilding?.type === 'barracks' && !pendingAction && (
                    <div style={styles.menuGroup}>
                        <span style={styles.label}>INFANTRY</span>
                        <ProductionButton unitType="ranger" building={activeBuilding} onCancel={handleCancelUnit} onTrain={(type, id) => handleAction(type, UNIT_STATS[type].cost, () => sendCommand('BUILD_UNIT', { unitType: type, buildingId: id }))} />
                    </div>
                )}

                {/* Sell/Cancel Logic */}
                {activeBuilding && !pendingAction && (
                    <div style={styles.managementGroup}>
                        <span style={styles.label}>OPTIONS</span>
                        <button style={{ ...styles.btn, color: activeBuilding.status === 'CONSTRUCTING' ? '#ffcc00' : '#ff4444' }}
                            onClick={() => activeBuilding.status === 'CONSTRUCTING' ? sendCommand('CANCEL_BUILDING', { buildingId: activeBuilding.id }) : requestSell(activeBuilding)}>
                            {activeBuilding.status === 'CONSTRUCTING' ? 'CANCEL (100%)' : 'SELL (50%)'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CommandPanel;