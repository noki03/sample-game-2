export const updateCombat = (state) => {
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
            target.health -= (unit.stats.damage / 10);
        }
    });
};