// src/game/systems/movementSystem.js
import { UNIT_STATS } from '../constants';

export const updateUnitMovement = (state) => {
    state.units.forEach(unit => {
        if (!unit.isMoving) return;

        const dx = unit.targetX - unit.x;
        const dy = unit.targetY - unit.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Standard stop range
        const stopRange = unit.status === 'MOVING_TO_BUILD' ? 5 : 5;

        if (distance <= stopRange) {
            unit.x = unit.targetX;
            unit.y = unit.targetY;
            unit.isMoving = false;

            if (unit.status === 'MOVING_TO_BUILD') {
                unit.status = 'CONSTRUCTING';
            } else {
                unit.status = 'IDLE';
            }
            return;
        }

        const stats = unit.stats || UNIT_STATS[unit.type] || { speed: 5 };
        const moveX = (dx / distance) * stats.speed;
        const moveY = (dy / distance) * stats.speed;

        const nextX = unit.x + moveX;
        const nextY = unit.y + moveY;
        const unitRadius = 10;

        // NEW LOGIC: Only collide with buildings that are 'READY'
        const willHitBuilding = state.buildings.some(b => {
            if (b.status === 'CONSTRUCTING') return false; // Walk through ghosts

            return (nextX + unitRadius > b.x &&
                nextX - unitRadius < b.x + 50 &&
                nextY + unitRadius > b.y &&
                nextY - unitRadius < b.y + 50);
        });

        if (!willHitBuilding) {
            unit.x = nextX;
            unit.y = nextY;
        } else {
            unit.isMoving = false;
            unit.status = 'IDLE';
        }
    });
};

export const resolveUnitCollisions = (state) => {
    const units = state.units;
    const radius = 10;
    const minDistance = radius * 2;
    for (let i = 0; i < units.length; i++) {
        for (let j = i + 1; j < units.length; j++) {
            const u1 = units[i]; const u2 = units[j];
            const dx = u2.x - u1.x; const dy = u2.y - u1.y;
            const distSq = dx * dx + dy * dy;
            if (distSq < minDistance * minDistance && distSq > 0) {
                const dist = Math.sqrt(distSq);
                const overlap = (minDistance - dist) / 2;
                const nx = dx / dist; const ny = dy / dist;
                u1.x -= nx * overlap; u1.y -= ny * overlap;
                u2.x += nx * overlap; u2.y += ny * overlap;
            }
        }
    }
};