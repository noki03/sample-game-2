import { UNIT_STATS, BUILDING_STATS } from '../constants';

/**
 * Checks if a proposed building location overlaps with existing structures.
 * @param {Object} state - Current game state
 * @param {number} x - Target X coordinate
 * @param {number} y - Target Y coordinate
 * @returns {boolean} - True if the area is occupied
 */
const isAreaOccupied = (state, x, y) => {
    const buildSize = 50;
    const margin = 2; // Slight buffer to prevent tight pixel clipping

    // Check against existing buildings
    const buildingOverlap = state.buildings.some(b => {
        return !(x + buildSize - margin < b.x ||
            x + margin > b.x + 50 ||
            y + buildSize - margin < b.y ||
            y + margin > b.y + 50);
    });

    // Check against units (prevents trapping units inside walls)
    const unitOverlap = state.units.some(u => {
        return (u.x >= x && u.x <= x + buildSize &&
            u.y >= y && u.y <= y + buildSize);
    });

    return buildingOverlap || unitOverlap;
};

export const processCommands = (state, commands) => {
    commands.forEach(command => {
        const { type, payload, playerId } = command;

        // --- Place Building (with Collision Detection) ---
        if (type === 'PLACE_BUILDING') {
            const player = state.players.find(p => p.id === playerId);
            const stats = BUILDING_STATS[payload.buildingType];

            if (player && player.resources.money >= stats.cost) {
                // Verify the location is clear before proceeding
                if (!isAreaOccupied(state, payload.x, payload.y)) {
                    player.resources.money -= stats.cost;
                    state.buildings.push({
                        id: Date.now() + Math.random(),
                        ownerId: playerId,
                        type: payload.buildingType,
                        x: payload.x,
                        y: payload.y,
                        health: 10,
                        maxHealth: stats.maxHealth,
                        status: 'CONSTRUCTING',
                        progress: 0,
                        queue: [],
                        // Default rally point slightly in front of the building
                        rallyPoint: { x: payload.x + 25, y: payload.y + 80 }
                    });
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
                    if (!payload.targetUnitId) {
                        // Move to ground
                        unit.targetX = payload.targetX;
                        unit.targetY = payload.targetY;
                        unit.isMoving = true;
                        unit.status = 'MOVING';
                        unit.targetEntityId = null;
                    } else if (unit.stats.damage > 0) {
                        // Attack Target (Only if unit has damage stats)
                        unit.targetEntityId = payload.targetUnitId;
                        unit.status = 'ATTACKING';
                        unit.isMoving = false;
                    }
                }
            });
        }

        // --- Unit Production (Training) ---
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

        if (type === 'CANCEL_BUILDING') {
            const buildingIndex = state.buildings.findIndex(b => b.id === payload.buildingId);
            const player = state.players.find(p => p.id === playerId);

            if (buildingIndex !== -1 && player) {
                const building = state.buildings[buildingIndex];
                // Only allow cancel if it's still being built
                if (building.status === 'CONSTRUCTING') {
                    const stats = BUILDING_STATS[building.type];
                    player.resources.money += stats.cost; // Full refund
                    state.buildings.splice(buildingIndex, 1);
                }
            }
        }

        // --- SELL_BUILDING (50% Refund) ---
        if (type === 'SELL_BUILDING') {
            const buildingIndex = state.buildings.findIndex(b => b.id === payload.buildingId);
            const player = state.players.find(p => p.id === playerId);

            if (buildingIndex !== -1 && player) {
                const building = state.buildings[buildingIndex];
                // Only allow sell if it's finished
                if (building.status === 'READY') {
                    const stats = BUILDING_STATS[building.type];
                    player.resources.money += Math.floor(stats.cost * 0.5); // 50% refund
                    state.buildings.splice(buildingIndex, 1);
                }
            }
        }
    });
};