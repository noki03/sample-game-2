import React from 'react';
import { styles } from './styles';
import { UNIT_STATS } from '../../game/constants';

const ProductionButton = ({ unitType, building, onTrain, onCancel }) => {
    const stats = UNIT_STATS[unitType];
    const queue = building.queue || [];
    const isCurrentlyBuilding = queue[0]?.type === unitType;
    const progress = isCurrentlyBuilding ? (queue[0].progress / queue[0].totalTime) * 100 : 0;
    const countInQueue = queue.filter(item => item.type === unitType).length;
    const progressDegrees = (progress / 100) * 360;

    return (
        <div style={{ position: 'relative' }}>
            <button
                style={{ ...styles.btn, borderColor: isCurrentlyBuilding ? '#00ff00' : '#555' }}
                className={isCurrentlyBuilding ? "btn-producing" : ""}
                onClick={() => onTrain(unitType, building.id)}
            >
                {isCurrentlyBuilding && (
                    <div style={{
                        ...styles.progressWipe,
                        background: `conic-gradient(transparent ${progressDegrees}deg, rgba(0,0,0,0.7) ${progressDegrees}deg)`
                    }} />
                )}
                <span style={{ zIndex: 2 }}>{unitType.toUpperCase()}</span>
                <span style={{ zIndex: 2, fontSize: '10px', opacity: 0.7 }}>${stats.cost}</span>
            </button>

            {countInQueue > 0 && (
                <div style={styles.cancelBadge} onClick={(e) => { e.stopPropagation(); onCancel(building.id, unitType); }}>
                    ✕ <span style={{ fontSize: '9px' }}>{countInQueue}</span>
                </div>
            )}
        </div>
    );
};

export default ProductionButton;