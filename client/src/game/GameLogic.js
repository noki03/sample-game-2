// client/src/game/GameLogic.js
import { UNIT_STATS } from './constants';

const processCommands = (state, commands) => {
    commands.forEach(command => {
        const { type, payload, playerId } = command;

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

        if (type === 'BUILD_UNIT') {
            const player = state.players.find(p => p.id === playerId);
            const building = state.buildings.find(b => b.id === payload.buildingId);
            const stats = UNIT_STATS[payload.unitType];

            if (player && building && player.resources.money >= stats.cost) {
                player.resources.money -= stats.cost;
                building.queue.push({
                    type: payload.unitType,
                    progress: 0,
                    totalTime: stats.buildTime
                });
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
    const radius = 10; // Collision radius (matches drawing size)
    const minDistance = radius * 2;
    const iterations = 2; // Running twice makes the "jiggle" more stable

    for (let step = 0; step < iterations; step++) {
        for (let i = 0; i < units.length; i++) {
            for (let j = i + 1; j < units.length; j++) {
                const u1 = units[i];
                const u2 = units[j];

                const dx = u2.x - u1.x;
                const dy = u2.y - u1.y;
                const distanceSq = dx * dx + dy * dy;

                if (distanceSq < minDistance * minDistance && distanceSq > 0) {
                    const distance = Math.sqrt(distanceSq);
                    const overlap = (minDistance - distance) / 2;

                    // Normal vector
                    const nx = dx / distance;
                    const ny = dy / distance;

                    // Push each unit back by half the overlap
                    u1.x -= nx * overlap;
                    u1.y -= ny * overlap;
                    u2.x += nx * overlap;
                    u2.y += ny * overlap;
                }
            }
        }
    }
};

const updateProduction = (state) => {
    state.buildings.forEach(b => {
        if (b.queue && b.queue.length > 0) {
            const currentItem = b.queue[0];
            currentItem.progress += 1;

            if (currentItem.progress >= currentItem.totalTime) {
                const stats = UNIT_STATS[currentItem.type];
                state.units.push({
                    id: Math.random(), // Unique per spawn
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
            target.health -= (unit.stats.damage / 10);
            if (target.health < 0) target.health = 0;
        }
    });
};

const cleanupState = (state) => {
    state.units = state.units.filter(u => u.health > 0);
    state.buildings = state.buildings.filter(b => b.health > 0);
};

const checkWinConditions = (state) => {
    // 1. Grace Period: Don't check in the first 2-3 seconds of the game
    if (state.tick < 100) return;

    // 2. Identify the player
    const selfPlayer = state.players[0];
    if (!selfPlayer || selfPlayer.id === 'self') return; // Wait for Socket ID sync

    const selfId = selfPlayer.id;

    // 3. Count assets
    const ownBuildings = state.buildings.filter(b => b.ownerId === selfId);
    const ownUnits = state.units.filter(u => u.ownerId === selfId);

    const enemyBuildings = state.buildings.filter(b => b.ownerId !== selfId);
    const enemyUnits = state.units.filter(u => u.ownerId !== selfId);

    // 4. Evaluate status
    if (ownBuildings.length === 0 && ownUnits.length === 0) {
        state.status = 'DEFEAT';
    } else if (enemyBuildings.length === 0 && enemyUnits.length === 0) {
        state.status = 'VICTORY';
    }
};

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
    checkWinConditions(newState);

    return newState;
};