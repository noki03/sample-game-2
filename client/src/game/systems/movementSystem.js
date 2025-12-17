// src/game/systems/movementSystem.js
import { UNIT_STATS } from '../constants';

export const updateUnitMovement = (state) => {
    state.units.forEach(unit => {
        if (!unit.isMoving) return;

        // Decrement ignore timer if it exists
        if (unit.ignoreCollisionTicks > 0) {
            unit.ignoreCollisionTicks--;
        }

        const dx = unit.targetX - unit.x;
        const dy = unit.targetY - unit.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        const stopRange = unit.status === 'MOVING_TO_BUILD' ? 40 : 5;
        if (distance <= stopRange) {
            unit.isMoving = false;
            unit.status = unit.status === 'MOVING_TO_BUILD' ? 'CONSTRUCTING' : 'IDLE';
            return;
        }

        const stats = unit.stats || { speed: 5 };
        const moveX = (dx / distance) * stats.speed;
        const moveY = (dy / distance) * stats.speed;

        const nextX = unit.x + moveX;
        const nextY = unit.y + moveY;
        const unitRadius = 10;

        // FIX: Check collisions ONLY if the unit isn't in its "spawn protection" phase
        const willHitBuilding = unit.ignoreCollisionTicks > 0 ? false : state.buildings.some(b => {
            return (nextX + unitRadius > b.x &&
                nextX - unitRadius < b.x + 50 &&
                nextY + unitRadius > b.y &&
                nextY - unitRadius < b.y + 50);
        });

        if (!willHitBuilding) {
            unit.x = nextX;
            unit.y = nextY;
        } else {
            // If they hit something, stop and wait for a new order
            unit.isMoving = false;
            unit.status = 'IDLE';
            unit.targetX = null;
            unit.targetY = null;
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