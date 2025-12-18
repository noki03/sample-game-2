import { UNIT_STATS, BUILDING_STATS } from '../constants';
import { Pathfinding } from '../logic/Pathfinding';

/**
 * Checks if a proposed building location overlaps with existing structures or units.
 */
const isAreaOccupied = (state, x, y) => {
    const buildSize = 50;
    const margin = 2;

    const buildingOverlap = state.buildings.some(b => {
        return !(x + buildSize - margin < b.x ||
            x + margin > b.x + 50 ||
            y + buildSize - margin < b.y ||
            y + margin > b.y + 50);
    });

    const unitOverlap = state.units.some(u => {
        return (u.x >= x && u.x <= x + buildSize &&
            u.y >= y && u.y <= y + buildSize);
    });

    return buildingOverlap || unitOverlap;
};

export const processCommands = (state, commands) => {
    commands.forEach(command => {
        const { type, payload, playerId } = command;

        // --- Place Building (Generals Style) ---
        if (type === 'PLACE_BUILDING') {
            const player = state.players.find(p => p.id === playerId);
            const stats = BUILDING_STATS[payload.buildingType];

            if (player && player.resources.money >= stats.cost) {
                if (!isAreaOccupied(state, payload.x, payload.y)) {
                    player.resources.money -= stats.cost;
                    const newBuildingId = Date.now() + Math.random();

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

                    // Assign nearest builder and calculate path to site
                    const builder = state.units
                        .filter(u => u.ownerId === playerId && u.type === 'builder' && u.status !== 'MOVING_TO_BUILD')
                        .sort((a, b) => Math.hypot(a.x - payload.x, a.y - payload.y) - Math.hypot(b.x - payload.x, b.y - payload.y))[0];

                    if (builder) {
                        const targetPos = { x: payload.x + 25, y: payload.y + 25 };
                        const path = Pathfinding.findPath({ x: builder.x, y: builder.y }, targetPos, state);

                        builder.path = path;
                        builder.pathIndex = 0;
                        builder.targetX = path ? path[0].x : targetPos.x;
                        builder.targetY = path ? path[0].y : targetPos.y;
                        builder.isMoving = true;
                        builder.status = 'MOVING_TO_BUILD';
                        builder.task = { type: 'CONSTRUCT', targetId: newBuildingId };
                    }
                }
            }
        }

        // --- Set Rally Point ---
        if (type === 'SET_RALLY_POINT') {
            const building = state.buildings.find(b => b.id === payload.buildingId);
            const productionTypes = ['barracks', 'war_factory', 'command_center', 'supply_center'];

            if (building && building.ownerId === playerId && productionTypes.includes(building.type)) {
                building.rallyPoint = { x: payload.x, y: payload.y };
            }
        }

        // --- Unit Movement & Attack (Hybrid Pathfinding) ---
        if (type === 'MOVE_UNITS') {
            payload.unitIds.forEach(unitId => {
                const unit = state.units.find(u => u.id === unitId);
                if (unit && unit.ownerId === playerId) {
                    const dest = payload.targetUnitId ?
                        (state.buildings.find(b => b.id === payload.targetUnitId) || state.units.find(u => u.id === payload.targetUnitId)) :
                        { x: payload.targetX, y: payload.targetY };

                    if (dest) {
                        const path = Pathfinding.findPath({ x: unit.x, y: unit.y }, dest, state);
                        unit.path = path;
                        unit.pathIndex = 0;
                        unit.targetX = path[0].x;
                        unit.targetY = path[0].y;
                        unit.isMoving = true;

                        // Handle task assignment (Building or Attack)
                        if (dest.status === 'CONSTRUCTING' && unit.type === 'builder') {
                            unit.status = 'MOVING_TO_BUILD';
                            unit.task = { type: 'CONSTRUCT', targetId: dest.id };
                        } else if (unit.stats?.damage > 0 && payload.targetUnitId) {
                            unit.status = 'ATTACKING';
                            unit.targetEntityId = payload.targetUnitId;
                        } else {
                            unit.status = 'MOVING';
                            unit.task = null;
                        }
                    }
                }
            });
        }

        // --- Unit Production ---
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
                    player.resources.money += BUILDING_STATS[building.type].cost;
                    const builder = state.units.find(u => u.task?.targetId === building.id);
                    if (builder) { builder.task = null; builder.status = 'IDLE'; }
                    state.buildings.splice(buildingIndex, 1);
                }
            }
        }

        // --- Sell Building ---
        if (type === 'SELL_BUILDING') {
            const buildingIndex = state.buildings.findIndex(b => b.id === payload.buildingId);
            const player = state.players.find(p => p.id === playerId);

            if (buildingIndex !== -1 && player) {
                const building = state.buildings[buildingIndex];
                if (building.status === 'READY') {
                    player.resources.money += Math.floor(BUILDING_STATS[building.type].cost * 0.5);
                    state.buildings.splice(buildingIndex, 1);
                }
            }
        }
    });
};