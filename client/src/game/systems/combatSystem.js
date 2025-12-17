// src/game/systems/combatSystem.js

export const updateCombat = (state) => {
    // Initialize an effects array if it doesn't exist for this tick
    state.effects = [];

    state.units.forEach(unit => {
        if (unit.status !== 'ATTACKING' || !unit.targetEntityId) return;

        const target = state.units.find(u => u.id === unit.targetEntityId) ||
            state.buildings.find(b => b.id === unit.targetEntityId);

        if (!target || target.health <= 0) {
            unit.status = 'IDLE';
            unit.targetEntityId = null;
            return;
        }

        const dx = target.x - unit.x;
        const dy = target.y - unit.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > (unit.stats.range || 50)) {
            unit.isMoving = true;
            unit.x += (dx / distance) * unit.stats.speed;
            unit.y += (dy / distance) * unit.stats.speed;
        } else {
            unit.isMoving = false;

            // DAMAGE LOGIC
            target.health -= (unit.stats.damage / 10);

            // --- NEW: Add Combat Effect Data ---
            // Every few ticks, we "fire" a shot
            if (state.tick % 5 === 0) {
                state.effects.push({
                    type: 'TRACER',
                    fromX: unit.x,
                    fromY: unit.y,
                    toX: target.x + (target.width ? target.width / 2 : 0), // Aim for center
                    toY: target.y + (target.height ? target.height / 2 : 0),
                    color: unit.type === 'crusader' ? '#ffcc00' : '#ffffff'
                });
            }
        }
    });
};