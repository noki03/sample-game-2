import { BUILDING_STATS, UNIT_STATS } from '../constants';

export const updateConstruction = (state) => {
    state.buildings.forEach(b => {
        if (b.status === 'CONSTRUCTING') {
            const stats = BUILDING_STATS[b.type];
            const targetTime = stats?.buildTime || 300; // Use stat or default

            b.progress += 1;
            b.health = Math.min(b.maxHealth, (b.progress / targetTime) * b.maxHealth);

            if (b.progress >= targetTime) {
                b.status = 'READY';
                b.health = b.maxHealth;
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