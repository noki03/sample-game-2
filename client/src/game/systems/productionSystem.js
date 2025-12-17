import { BUILDING_STATS, UNIT_STATS } from '../constants';

/**
 * Handles the construction of building frames (Zero Hour Style).
 * Progress only increments if an assigned builder is within range and "working".
 */
export const updateConstruction = (state) => {
    state.buildings.forEach(b => {
        if (b.status === 'CONSTRUCTING') {
            // Find a builder assigned to this building and currently "at work" (in CONSTRUCTING status)
            const activeBuilder = state.units.find(u =>
                u.ownerId === b.ownerId &&
                u.status === 'CONSTRUCTING' &&
                u.task?.targetId === b.id
            );

            if (activeBuilder) {
                const stats = BUILDING_STATS[b.type];
                const targetTime = stats?.buildTime || 300;

                // Progress only increments when a builder is present at the frame
                b.progress += 1;

                // preserve progress/health even if the builder is interrupted later
                b.health = Math.min(b.maxHealth, (b.progress / targetTime) * b.maxHealth);

                if (b.progress >= targetTime) {
                    b.status = 'READY';
                    b.health = b.maxHealth;

                    // Release the builder to an IDLE state
                    activeBuilder.status = 'IDLE';
                    activeBuilder.task = null;
                }
            }
            // If no builder is present, construction is effectively "paused"
        }
    });
};

/**
 * Handles unit training from completed buildings.
 * Ensures units are spawned with a proper stats object for the combat system.
 */
export const updateProduction = (state) => {
    state.buildings.forEach(b => {
        if (b.queue && b.queue.length > 0 && b.status === 'READY') {
            const currentItem = b.queue[0];
            currentItem.progress += 1;

            if (currentItem.progress >= currentItem.totalTime) {
                const stats = UNIT_STATS[currentItem.type];

                // FIX: Spawn units at the bottom center of the building, 
                // just outside the 50x50 collision box.
                const spawnX = b.x + 25;
                const spawnY = b.y + 60; // 50 (building height) + 10 (buffer)

                const newUnit = {
                    id: Date.now() + Math.random(),
                    ownerId: b.ownerId,
                    type: currentItem.type,
                    x: spawnX,
                    y: spawnY,
                    health: stats.maxHealth,
                    maxHealth: stats.maxHealth,
                    targetX: b.rallyPoint ? b.rallyPoint.x : b.x + 25,
                    targetY: b.rallyPoint ? b.rallyPoint.y : b.y + 100,
                    isMoving: true,
                    status: 'MOVING',
                    stats: { ...stats },
                    // NEW: Temporary ignore collision flag to prevent getting stuck
                    ignoreCollisionTicks: 10
                };

                state.units.push(newUnit);
                b.queue.shift();
            }
        }
    });
};