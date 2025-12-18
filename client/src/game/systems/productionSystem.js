// src/game/systems/productionSystem.js
import { BUILDING_STATS, UNIT_STATS } from '../constants';
import { Pathfinding } from '../logic/Pathfinding';

export const updateConstruction = (state) => {
    state.buildings.forEach(b => {
        if (b.status === 'CONSTRUCTING') {
            const activeBuilder = state.units.find(u =>
                u.ownerId === b.ownerId &&
                u.status === 'CONSTRUCTING' &&
                u.task?.targetId === b.id
            );

            if (activeBuilder) {
                const stats = BUILDING_STATS[b.type];
                const targetTime = stats?.buildTime || 300;

                b.progress += 1;
                b.health = Math.min(b.maxHealth, (b.progress / targetTime) * b.maxHealth);

                if (b.progress >= targetTime) {
                    b.status = 'READY';
                    b.health = b.maxHealth;

                    // NEW: Eject units caught inside the building
                    ejectUnitsFromBuilding(state, b);

                    activeBuilder.status = 'IDLE';
                    activeBuilder.task = null;
                }
            }
        }
    });
};

/**
 * Pushes any units inside the building footprint to the outside edge.
 */
const ejectUnitsFromBuilding = (state, building) => {
    const margin = 15; // Distance to move outside the 50x50 box
    state.units.forEach(u => {
        // Check if unit is inside building bounds
        if (u.x > building.x && u.x < building.x + 50 &&
            u.y > building.y && u.y < building.y + 50) {

            // Move unit to the bottom edge by default (Zero Hour style)
            u.y = building.y + 50 + margin;
            u.targetX = null;
            u.targetY = null;
            u.isMoving = false;
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
                const spawnX = b.x + 25;
                const spawnY = b.y + 60;

                const dest = b.rallyPoint || { x: b.x + 25, y: b.y + 100 };
                // Calculate the smart path to the rally point
                const path = Pathfinding.findPath({ x: spawnX, y: spawnY }, dest, state);

                const newUnit = {
                    id: Date.now() + Math.random(),
                    ownerId: b.ownerId,
                    type: currentItem.type,
                    x: spawnX,
                    y: spawnY,
                    health: stats.maxHealth,
                    maxHealth: stats.maxHealth,
                    // Waypoint data for smooth movement
                    path: path,
                    pathIndex: 0,
                    targetX: path ? path[0].x : dest.x,
                    targetY: path ? path[0].y : dest.y,
                    isMoving: true,
                    status: 'MOVING',
                    stats: { ...stats }
                };

                state.units.push(newUnit);
                b.queue.shift();
            }
        }
    });
};