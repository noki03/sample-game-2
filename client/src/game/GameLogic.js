// client/src/game/GameLogic.js
import { UNIT_STATS } from './constants';

const processCommands = (state, commands) => {
    commands.forEach(command => {
        const { type, payload, playerId } = command;

        // --- Handle Movement & Attack Orders ---
        if (type === 'MOVE_UNITS') {
            payload.unitIds.forEach(unitId => {
                const unit = state.units.find(u => u.id === unitId);
                if (unit && unit.ownerId === playerId) {
                    if (payload.targetUnitId) {
                        unit.targetEntityId = payload.targetUnitId;
                        unit.status = 'ATTACKING';
                        unit.isMoving = false;
                    } else {
                        unit.targetX = payload.targetX;
                        unit.targetY = payload.targetY;
                        unit.isMoving = true;
                        unit.status = 'MOVING';
                        unit.targetEntityId = null;
                    }
                }
            });
        }

        // --- Handle Production Orders ---
        if (type === 'BUILD_UNIT') {
            const player = state.players.find(p => p.id === playerId);
            const building = state.buildings.find(b => b.id === payload.buildingId);
            const stats = UNIT_STATS[payload.unitType];

            if (player && building && player.resources.money >= stats.cost) {
                // Deduct cost immediately on command processing
                player.resources.money -= stats.cost;

                // Add to the building's production queue
                building.queue.push({
                    type: payload.unitType,
                    progress: 0,
                    totalTime: stats.buildTime
                });
                console.log(`Queued ${payload.unitType} at building ${building.id}`);
            }
        }
    });
};

const updateResources = (state) => {
    state.players.forEach(player => {
        player.resources.money += player.resources.incomeRate;
    });
};

const updateUnitMovement = (state) => {
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

        unit.x += (dx / distance) * unit.stats.speed;
        unit.y += (dy / distance) * unit.stats.speed;
    });
};


const resolveUnitCollisions = (state) => {
    const units = state.units;
    const radius = 12; // Slightly larger than the unit drawing size (10)
    const pushStrength = 0.5; // How strongly they push each other away

    for (let i = 0; i < units.length; i++) {
        for (let j = i + 1; j < units.length; j++) {
            const u1 = units[i];
            const u2 = units[j];

            const dx = u2.x - u1.x;
            const dy = u2.y - u1.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDistance = radius * 2;

            if (distance < minDistance && distance > 0) {
                // Calculate overlap
                const overlap = minDistance - distance;
                const nx = dx / distance; // Normal X
                const ny = dy / distance; // Normal Y

                // Push them apart
                const moveX = nx * overlap * pushStrength;
                const moveY = ny * overlap * pushStrength;

                u1.x -= moveX;
                u1.y -= moveY;
                u2.x += moveX;
                u2.y += moveY;
            }
        }
    }
};
// client/src/game/GameLogic.js

const updateProduction = (state) => {
    state.buildings.forEach(b => {
        if (b.queue && b.queue.length > 0) {
            const currentItem = b.queue[0];
            currentItem.progress += 1;

            if (currentItem.progress >= currentItem.totalTime) {
                const stats = UNIT_STATS[currentItem.type];

                const newUnit = {
                    id: Date.now() + Math.random(),
                    ownerId: b.ownerId, // This ensures the unit matches the building (which is now your Socket ID)
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
                };

                state.units.push(newUnit);
                b.queue.shift();
                console.log(`Successfully spawned ${newUnit.type} for owner ${newUnit.ownerId}`);
            }
        }
    });
};

const updateCombat = (state) => {
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

        if (distance > unit.stats.range) {
            unit.isMoving = true;
            unit.x += (dx / distance) * unit.stats.speed;
            unit.y += (dy / distance) * unit.stats.speed;
        } else {
            unit.isMoving = false;

            // Rock-Paper-Scissors: Crusaders (Tanks) vs Buildings (HP > 400)
            let multiplier = 1.0;
            if (unit.type === 'crusader' && target.maxHealth > 400) multiplier = 2.0;

            target.health -= (unit.stats.damage / 10) * multiplier;
            if (target.health < 0) target.health = 0;
        }
    });
};

const cleanupState = (state) => {
    state.units = state.units.filter(u => u.health > 0);
    state.buildings = state.buildings.filter(b => b.health > 0);
};

/**
 * Main Deterministic Loop
 */
export const runDeterministicEngine = (oldState, commands, newTick) => {
    let newState = JSON.parse(JSON.stringify(oldState));
    newState.tick = newTick;

    processCommands(newState, commands);
    updateResources(newState);
    updateProduction(newState);
    updateUnitMovement(newState);
    resolveUnitCollisions(newState);
    updateCombat(newState);
    cleanupState(newState);

    return newState;
};