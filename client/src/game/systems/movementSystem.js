import { UNIT_STATS } from '../constants';

/**
 * Handles unit translation along calculated paths with precision snapping.
 */
export const updateUnitMovement = (state) => {
    state.units.forEach(unit => {
        if (!unit.isMoving || !unit.targetX) return;

        const dx = unit.targetX - unit.x;
        const dy = unit.targetY - unit.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Waypoint navigation and final snapping
        if (distance <= 4) {
            if (unit.path && unit.pathIndex < unit.path.length - 1) {
                // Move to next waypoint
                unit.pathIndex++;
                unit.targetX = unit.path[unit.pathIndex].x;
                unit.targetY = unit.path[unit.pathIndex].y;
            } else {
                // Final destination reached: Snap exactly to center
                unit.x = unit.targetX;
                unit.y = unit.targetY;
                unit.isMoving = false;
                unit.path = null;

                if (unit.status === 'MOVING_TO_BUILD') {
                    unit.status = 'CONSTRUCTING'; // Status shift happens AT the center
                } else {
                    unit.status = 'IDLE';
                }
            }
            return;
        }

        // Use global stats for consistent speed across all systems
        const speed = unit.stats?.speed || UNIT_STATS[unit.type]?.speed || 5;
        unit.x += (dx / distance) * speed;
        unit.y += (dy / distance) * speed;
    });
};

/**
 * Simple radial collision resolution to prevent units from stacking.
 */
export const resolveUnitCollisions = (state) => {
    const units = state.units;
    const radius = 10;
    const minDistance = radius * 2;

    for (let i = 0; i < units.length; i++) {
        for (let j = i + 1; j < units.length; j++) {
            const u1 = units[i];
            const u2 = units[j];
            const dx = u2.x - u1.x;
            const dy = u2.y - u1.y;
            const distSq = dx * dx + dy * dy;

            if (distSq < minDistance * minDistance && distSq > 0) {
                const dist = Math.sqrt(distSq);
                const overlap = (minDistance - dist) / 2;
                const nx = dx / dist;
                const ny = dy / dist;
                u1.x -= nx * overlap;
                u1.y -= ny * overlap;
                u2.x += nx * overlap;
                u2.y += ny * overlap;
            }
        }
    }
};