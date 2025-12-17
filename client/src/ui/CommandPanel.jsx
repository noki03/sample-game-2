import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { sendCommand } from '../network/SocketManager';
import { UNIT_STATS, BUILDING_STATS } from '../game/constants';

const CommandPanel = () => {
    const gameState = useGameStore(state => state.gameState);
    // These need to be added to your useGameStore:
    const notification = useGameStore(state => state.notification);
    const setNotification = useGameStore(state => state.setNotification);

    const { units, buildings, selectedUnitIds } = gameState;
    const selfId = useGameStore(state => state.getSelfPlayerId());

    const player = gameState.players.find(p => p.id === selfId);
    if (!player) return null;

    const selectedEntities = [...units, ...buildings].filter(e => selectedUnitIds.includes(e.id));
    const hasBuilder = selectedEntities.some(e => e.type === 'builder');
    const activeBuilding = buildings.find(b => selectedUnitIds.includes(b.id) && b.ownerId === selfId);

    const handlePlaceBuilding = (type) => {
        const stats = BUILDING_STATS[type];
        if (player.resources.money < stats.cost) {
            // NEW: Use localized notification instead of alert
            return setNotification ? setNotification("INSUFFICIENT FUNDS") : alert("Insufficient Funds!");
        }
        useGameStore.getState().setPlacementMode(type);
    };

    const handleTrainUnit = (unitType, buildingId) => {
        const stats = UNIT_STATS[unitType];
        if (player.resources.money < stats.cost) {
            // NEW: Use localized notification instead of alert
            return setNotification ? setNotification("INSUFFICIENT FUNDS") : alert("Insufficient Funds!");
        }
        sendCommand('BUILD_UNIT', { unitType, buildingId });
    };

    const handleBuildingAction = (building) => {
        if (building.status === 'CONSTRUCTING') {
            sendCommand('CANCEL_BUILDING', { buildingId: building.id });
        } else {
            if (window.confirm("Sell this structure for 50% refund?")) {
                sendCommand('SELL_BUILDING', { buildingId: building.id });
            }
        }
    };

    const handleCancelUnit = (buildingId, unitType) => {
        const building = buildings.find(b => b.id === buildingId);
        const index = building?.queue.findIndex(item => item.type === unitType);
        if (index !== -1) {
            sendCommand('CANCEL_PRODUCTION', { buildingId, index });
        }
    };

    const renderUnitBtn = (unitType, building) => {
        const stats = UNIT_STATS[unitType];
        const queue = building.queue || [];
        const isCurrentlyBuilding = queue[0]?.type === unitType;
        const progress = isCurrentlyBuilding ? (queue[0].progress / queue[0].totalTime) * 100 : 0;
        const countInQueue = queue.filter(item => item.type === unitType).length;

        return (
            <div key={unitType} style={{ position: 'relative' }}>
                <button
                    style={styles.btn}
                    onClick={() => handleTrainUnit(unitType, building.id)}
                >
                    {isCurrentlyBuilding && (
                        <div style={{
                            ...styles.progressOverlay,
                            height: `${100 - progress}%`,
                        }} />
                    )}
                    <span style={{ zIndex: 2 }}>{unitType.toUpperCase()}</span>
                    <span style={{ zIndex: 2, fontSize: '10px', opacity: 0.7 }}>${stats.cost}</span>
                </button>

                {countInQueue > 0 && (
                    <div
                        style={styles.cancelBadge}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleCancelUnit(building.id, unitType);
                        }}
                    >
                        ✕ <span style={{ fontSize: '9px' }}>{countInQueue}</span>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div style={styles.panel} className="command-panel">
            {/* NEW: Insufficient Funds Floating Message */}
            {notification && (
                <div style={styles.notificationOverlay} className="notification-pulse">
                    ⚠️ {notification}
                </div>
            )}

            {/* 1. Context Tab */}
            {selectedEntities.length === 1 && (
                <div style={styles.contextLabel}>
                    {selectedEntities[0].type.replace('_', ' ').toUpperCase()}
                </div>
            )}

            {/* 2. Resources */}
            <div style={styles.resourceSection}>
                <h2 style={{ color: '#00ff00', margin: 0 }}>${Math.floor(player.resources.money)}</h2>
                <div style={{ fontSize: '12px', marginTop: '5px' }}>
                    <div style={{ color: player.resources.power >= 0 ? '#aaa' : '#ff4444' }}>
                        ⚡ POWER: {player.resources.power}
                    </div>
                </div>
            </div>

            {/* 3. Action Area */}
            <div style={styles.buttonArea}>
                {hasBuilder && (
                    <div style={styles.menuGroup}>
                        <span style={styles.label}>STRUCTURES</span>
                        {Object.keys(BUILDING_STATS).map(type => (
                            <button key={type} style={styles.btn} onClick={() => handlePlaceBuilding(type)}>
                                {type.replace('_', ' ').toUpperCase()} (${BUILDING_STATS[type].cost})
                            </button>
                        ))}
                    </div>
                )}

                {activeBuilding?.type === 'barracks' && (
                    <div style={styles.menuGroup}>
                        <span style={styles.label}>INFANTRY</span>
                        {renderUnitBtn('ranger', activeBuilding)}
                    </div>
                )}

                {activeBuilding?.type === 'war_factory' && (
                    <div style={styles.menuGroup}>
                        <span style={styles.label}>VEHICLES</span>
                        {renderUnitBtn('crusader', activeBuilding)}
                    </div>
                )}

                {activeBuilding && (
                    <div style={styles.managementGroup}>
                        <span style={styles.label}>OPTIONS</span>
                        <button
                            style={{
                                ...styles.btn,
                                borderColor: activeBuilding.status === 'CONSTRUCTING' ? '#ffcc00' : '#ff4444',
                                color: activeBuilding.status === 'CONSTRUCTING' ? '#ffcc00' : '#ff4444'
                            }}
                            onClick={() => handleBuildingAction(activeBuilding)}
                        >
                            {activeBuilding.status === 'CONSTRUCTING' ? 'CANCEL (100%)' : 'SELL (50%)'}
                        </button>
                    </div>
                )}

                {selectedEntities.length === 0 && (
                    <div style={{ color: '#555', fontStyle: 'italic', alignSelf: 'center' }}>
                        Select a unit or building to see options
                    </div>
                )}
            </div>
        </div>
    );
};

const styles = {
    panel: {
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100%',
        height: '180px',
        backgroundColor: '#151515',
        borderTop: '3px solid #00ff00',
        display: 'flex',
        padding: '20px',
        color: '#fff',
        zIndex: 1000,
        boxSizing: 'border-box',
        overflow: 'visible'
    },
    // NEW Style for the alert
    notificationOverlay: {
        position: 'absolute',
        top: '-60px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: '#ff0000',
        color: '#fff',
        padding: '10px 25px',
        fontWeight: 'bold',
        fontSize: '14px',
        borderRadius: '4px',
        boxShadow: '0 0 15px rgba(255, 0, 0, 0.6)',
        whiteSpace: 'nowrap',
        zIndex: 1001
    },
    contextLabel: {
        position: 'absolute', top: '-28px', left: '20px', background: '#00ff00',
        color: '#000', padding: '4px 15px', fontWeight: 'bold', fontSize: '12px',
        borderRadius: '4px 4px 0 0', textTransform: 'uppercase'
    },
    resourceSection: {
        width: '180px', borderRight: '2px solid #333',
        display: 'flex', flexDirection: 'column', justifyContent: 'center'
    },
    buttonArea: { flex: 1, paddingLeft: '30px', display: 'flex', gap: '40px' },
    menuGroup: { display: 'flex', flexWrap: 'wrap', gap: '10px', alignContent: 'flex-start' },
    managementGroup: { display: 'flex', flexDirection: 'column', gap: '10px', borderLeft: '1px solid #333', paddingLeft: '20px' },
    label: { width: '100%', fontSize: '10px', fontWeight: 'bold', color: '#00ff00', marginBottom: '5px', opacity: 0.8 },
    btn: {
        position: 'relative', background: '#2a2a2a', color: '#eee', border: '1px solid #555',
        padding: '12px 15px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold',
        minWidth: '130px', transition: '0.1s', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center'
    },
    progressOverlay: {
        position: 'absolute', bottom: 0, left: 0, width: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.7)', zIndex: 1, pointerEvents: 'none'
    },
    cancelBadge: {
        position: 'absolute', top: '-8px', right: '-8px', background: '#ff4444',
        color: '#fff', width: '24px', height: '24px', borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', zIndex: 10,
        boxShadow: '0 0 5px rgba(0,0,0,0.5)', border: '1px solid #fff'
    }
};

export default CommandPanel;