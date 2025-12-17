import { BUILDING_STATS, UNIT_STATS } from '../constants';

export const updateConstruction = (state) => {
    state.buildings.forEach(b => {
        if (b.status === 'CONSTRUCTING') {
            // Find a builder assigned to this building and currently "at work"
            const activeBuilder = state.units.find(u =>
                u.ownerId === b.ownerId &&
                u.status === 'CONSTRUCTING' &&
                u.task?.targetId === b.id
            );

            if (activeBuilder) {
                const stats = BUILDING_STATS[b.type];
                const targetTime = stats?.buildTime || 300;

                // Progress only increments when a builder is present
                b.progress += 1;
                // Preserve health/progress: it doesn't reset to 0 if the builder leaves
                b.health = Math.min(b.maxHealth, (b.progress / targetTime) * b.maxHealth);

                if (b.progress >= targetTime) {
                    b.status = 'READY';
                    b.health = b.maxHealth;
                    activeBuilder.status = 'IDLE';
                    activeBuilder.task = null;
                }
            } else {
                // If no builder is nearby, the building just stays at its current health/progress
                // This acts as a "Pause"
            }
        }
    });
};

export const updateProduction = (state) => {
    state.buildings.forEach(b => {
        if (b.queue && b.queue.length > 0 && b.status === 'READY') {
            const currentItem = b.queue[0];
            currentItem.progress += 1;

            if (currentItem.progress >= currentItem.totalTime) {
                const stats = UNIT_STATS[currentItem.type];
                const newUnit = {
                    id: Date.now() + Math.random(),
                    ownerId: b.ownerId,
                    type: currentItem.type,
                    x: b.x + 25, // Spawn at building center
                    y: b.y + 25,
                    health: stats.maxHealth,
                    maxHealth: stats.maxHealth,
                    // NEW: Send to rally point immediately
                    targetX: b.rallyPoint ? b.rallyPoint.x : b.x + 60,
                    targetY: b.rallyPoint ? b.rallyPoint.y : b.y + 120,
                    isMoving: true,
                    status: 'MOVING',
                    stats: stats
                };
                state.units.push(newUnit);
                b.queue.shift();
            }
        }
    });
};