// src/game/systems/movementSystem.js

export const updateUnitMovement = (state) => {
    state.units.forEach(unit => {
        if (!unit.isMoving || unit.status !== 'MOVING') return;

        const dx = unit.targetX - unit.x;
        const dy = unit.targetY - unit.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= 5) {
            unit.x = unit.targetX;
            unit.y = unit.targetY;
            unit.isMoving = false;
            unit.status = 'IDLE';
            return;
        }

        const speed = unit.stats.speed || 5;
        unit.x += (dx / distance) * speed;
        unit.y += (dy / distance) * speed;
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