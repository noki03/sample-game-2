// src/game/systems/combatSystem.js

export const updateCombat = (state) => {
    state.effects = [];

    state.units.forEach(unit => {
        // 1. Safety check: must have stats and be in attacking mode
        if (!unit.stats || unit.status !== 'ATTACKING' || !unit.targetEntityId) return;

        // 2. Locate the target (unit or building)
        const target = state.units.find(u => u.id === unit.targetEntityId) ||
            state.buildings.find(b => b.id === unit.targetEntityId);

        // 3. If target is gone or dead, revert to IDLE
        if (!target || target.health <= 0) {
            unit.status = 'IDLE';
            unit.targetEntityId = null;
            unit.isMoving = false;
            return;
        }

        // 4. Calculate Distance
        const dx = target.x - unit.x;
        const dy = target.y - unit.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const range = unit.stats.range || 50;

        // 5. CHASE LOGIC: If out of range, move toward target
        if (distance > range) {
            unit.isMoving = true;
            const speed = unit.stats.speed || 2;

            // Update movement toward the target's current position
            unit.x += (dx / distance) * speed;
            unit.y += (dy / distance) * speed;

            // Keep target coordinates updated for the movement renderer if needed
            unit.targetX = target.x;
            unit.targetY = target.y;
        }
        // 6. ATTACK LOGIC: If in range, stop and deal damage
        else {
            unit.isMoving = false;
            unit.targetX = null;
            unit.targetY = null;

            // Apply Damage
            target.health -= (unit.stats.damage / 10);

            // 7. Visual Effects: Trigger tracers every 5 ticks
            if (state.tick % 5 === 0) {
                state.effects.push({
                    type: 'TRACER',
                    fromX: unit.x,
                    fromY: unit.y,
                    toX: target.x + (target.width ? target.width / 2 : 25), // Aim for center
                    toY: target.y + (target.height ? target.height / 2 : 25),
                    color: unit.type === 'crusader' ? '#ffcc00' : '#ffffff'
                });
            }
        }
    });
};