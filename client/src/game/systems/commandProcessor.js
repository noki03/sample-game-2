import { UNIT_STATS, BUILDING_STATS } from '../constants';

/**
 * Checks if a proposed building location overlaps with existing structures.
 */
const isAreaOccupied = (state, x, y) => {
    const buildSize = 50;
    const margin = 2;

    // 1. Check against ALL buildings (including those under construction)
    const buildingOverlap = state.buildings.some(b => {
        return !(x + buildSize - margin < b.x ||
            x + margin > b.x + 50 ||
            y + buildSize - margin < b.y ||
            y + margin > b.y + 50);
    });

    // 2. Check against ALL units
    // This prevents placing a building directly on top of a tank or infantry
    const unitOverlap = state.units.some(u => {
        return (u.x >= x && u.x <= x + buildSize &&
            u.y >= y && u.y <= y + buildSize);
    });

    return buildingOverlap || unitOverlap;
};

export const processCommands = (state, commands) => {
    commands.forEach(command => {
        const { type, payload, playerId } = command;

        // --- Place Building (C&C Generals Zero Hour Style) ---
        if (type === 'PLACE_BUILDING') {
            const player = state.players.find(p => p.id === playerId);
            const stats = BUILDING_STATS[payload.buildingType];

            if (player && player.resources.money >= stats.cost) {
                if (!isAreaOccupied(state, payload.x, payload.y)) {
                    // 1. Deduct resources upfront
                    player.resources.money -= stats.cost;

                    const newBuildingId = Date.now() + Math.random();

                    // 2. Create the "Frame" foundation (starts with 1 HP)
                    state.buildings.push({
                        id: newBuildingId,
                        ownerId: playerId,
                        type: payload.buildingType,
                        x: payload.x,
                        y: payload.y,
                        health: 1,
                        maxHealth: stats.maxHealth,
                        status: 'CONSTRUCTING',
                        progress: 0,
                        queue: [],
                        rallyPoint: { x: payload.x + 25, y: payload.y + 80 }
                    });

                    // 3. Find the nearest builder and assign the task
                    const builder = state.units
                        .filter(u => u.ownerId === playerId && u.type === 'builder' && u.status !== 'MOVING_TO_BUILD')
                        .sort((a, b) => {
                            const distA = Math.hypot(a.x - payload.x, a.y - payload.y);
                            const distB = Math.hypot(b.x - payload.x, b.y - payload.y);
                            return distA - distB;
                        })[0];

                    if (builder) {
                        builder.targetX = payload.x + 25; // Target center of building
                        builder.targetY = payload.y + 25;
                        builder.isMoving = true;
                        builder.status = 'MOVING_TO_BUILD'; // New status for construction transit
                        builder.task = { type: 'CONSTRUCT', targetId: newBuildingId }; // Assign specific task
                    }
                }
            }
        }

        // --- Set Rally Point ---
        if (type === 'SET_RALLY_POINT') {
            const building = state.buildings.find(b => b.id === payload.buildingId);
            const productionTypes = ['barracks', 'war_factory', 'command_center'];

            if (building && building.ownerId === playerId && productionTypes.includes(building.type)) {
                building.rallyPoint = { x: payload.x, y: payload.y };
            }
        }

        // --- Unit Movement & Attack ---
        if (type === 'MOVE_UNITS') {
            payload.unitIds.forEach(unitId => {
                const unit = state.units.find(u => u.id === unitId);
                if (unit && unit.ownerId === playerId) {

                    // 1. Check if target is a construction frame for builders
                    const targetBuilding = state.buildings.find(b =>
                        payload.targetUnitId === b.id && b.status === 'CONSTRUCTING'
                    );

                    if (targetBuilding && unit.type === 'builder') {
                        unit.targetX = targetBuilding.x + 25;
                        unit.targetY = targetBuilding.y + 25;
                        unit.isMoving = true;
                        unit.status = 'MOVING_TO_BUILD';
                        unit.task = { type: 'CONSTRUCT', targetId: targetBuilding.id };
                    }
                    // 2. Manual Move to Ground
                    else if (!payload.targetUnitId) {
                        unit.targetX = payload.targetX;
                        unit.targetY = payload.targetY;
                        unit.isMoving = true;
                        unit.status = 'MOVING';
                        unit.task = null;
                        unit.targetEntityId = null;
                    }
                    // 3. Attack Command (The Fix: check unit.stats.damage)
                    else {
                        const hasDamage = unit.stats && unit.stats.damage > 0;
                        if (hasDamage) {
                            unit.task = null;
                            unit.targetEntityId = payload.targetUnitId;
                            unit.status = 'ATTACKING';
                            unit.isMoving = true; // Set to true so combatSystem can handle the initial chase
                        }
                    }
                }
            });
        }

        // --- Unit Production (Only for completed buildings) ---
        if (type === 'BUILD_UNIT') {
            const player = state.players.find(p => p.id === playerId);
            const building = state.buildings.find(b => b.id === payload.buildingId);
            const stats = UNIT_STATS[payload.unitType];

            if (player && building && building.status === 'READY' && player.resources.money >= stats.cost) {
                player.resources.money -= stats.cost;
                building.queue.push({
                    type: payload.unitType,
                    progress: 0,
                    totalTime: stats.buildTime
                });
            }
        }

        // --- Cancel Construction ---
        if (type === 'CANCEL_BUILDING') {
            const buildingIndex = state.buildings.findIndex(b => b.id === payload.buildingId);
            const player = state.players.find(p => p.id === playerId);

            if (buildingIndex !== -1 && player) {
                const building = state.buildings[buildingIndex];
                if (building.status === 'CONSTRUCTING') {
                    const stats = BUILDING_STATS[building.type];
                    player.resources.money += stats.cost; // Full refund

                    // Release assigned builder
                    const builder = state.units.find(u => u.task?.targetId === building.id);
                    if (builder) {
                        builder.task = null;
                        builder.status = 'IDLE';
                    }

                    state.buildings.splice(buildingIndex, 1);
                }
            }
        }

        // --- Sell Finished Building ---
        if (type === 'SELL_BUILDING') {
            const buildingIndex = state.buildings.findIndex(b => b.id === payload.buildingId);
            const player = state.players.find(p => p.id === playerId);

            if (buildingIndex !== -1 && player) {
                const building = state.buildings[buildingIndex];
                if (building.status === 'READY') {
                    const stats = BUILDING_STATS[building.type];
                    player.resources.money += Math.floor(stats.cost * 0.5); // 50% refund
                    state.buildings.splice(buildingIndex, 1);
                }
            }
        }
    });
};