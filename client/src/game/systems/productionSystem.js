import { UNIT_STATS } from '../constants';

export const updateConstruction = (state) => {
    state.buildings.forEach(b => {
        if (b.status === 'CONSTRUCTING') {
            b.progress += 1;
            b.health = Math.min(b.maxHealth, (b.progress / 300) * b.maxHealth);

            if (b.progress >= 300) {
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
                state.units.push({
                    id: Date.now() + Math.random(),
                    ownerId: b.ownerId,
                    type: currentItem.type,
                    x: b.x + 60,
                    y: b.y + 60,
                    health: stats.maxHealth,
                    maxHealth: stats.maxHealth,
                    targetX: b.x + 120,
                    targetY: b.y + 120,
                    isMoving: true,
                    status: 'MOVING',
                    stats: stats
                });
                b.queue.shift();
            }
        }
    });
};