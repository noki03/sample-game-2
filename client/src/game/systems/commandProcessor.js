import { UNIT_STATS, BUILDING_STATS } from '../constants';
import { Pathfinding } from '../logic/Pathfinding';

const isAreaOccupied = (state, x, y) => {
    const buildSize = 50;
    const margin = 2;
    const buildingOverlap = state.buildings.some(b => {
        return !(x + buildSize - margin < b.x || x + margin > b.x + 50 || y + buildSize - margin < b.y || y + margin > b.y + 50);
    });
    const unitOverlap = state.units.some(u => {
        return (u.x >= x && u.x <= x + buildSize && u.y >= y && u.y <= y + buildSize);
    });
    return buildingOverlap || unitOverlap;
};

export const processCommands = (state, commands) => {
    commands.forEach(command => {
        const { type, payload, playerId } = command;

        // --- PLACE BUILDING ---
        if (type === 'PLACE_BUILDING') {
            const player = state.players.find(p => p.id === playerId);
            const stats = BUILDING_STATS[payload.buildingType];
            if (player && player.resources.money >= stats.cost) {
                if (!isAreaOccupied(state, payload.x, payload.y)) {
                    player.resources.money -= stats.cost;
                    const newId = Date.now() + Math.random();
                    state.buildings.push({
                        id: newId, ownerId: playerId, type: payload.buildingType,
                        x: payload.x, y: payload.y, health: 1, maxHealth: stats.maxHealth,
                        status: 'CONSTRUCTING', progress: 0, queue: [],
                        rallyPoint: { x: payload.x + 25, y: payload.y + 80 }
                    });
                    const builder = state.units.filter(u => u.ownerId === playerId && u.type === 'builder' && u.status !== 'MOVING_TO_BUILD')
                        .sort((a, b) => Math.hypot(a.x - payload.x, a.y - payload.y) - Math.hypot(b.x - payload.x, b.y - payload.y))[0];
                    if (builder) {
                        const path = Pathfinding.findPath({ x: builder.x, y: builder.y }, { x: payload.x + 25, y: payload.y + 25 }, state);
                        if (path) {
                            builder.path = path; builder.pathIndex = 0;
                            builder.targetX = path[0].x; builder.targetY = path[0].y;
                            builder.isMoving = true; builder.status = 'MOVING_TO_BUILD';
                            builder.task = { type: 'CONSTRUCT', targetId: newId };
                        }
                    }
                }
            }
        }

        // --- MOVE UNITS ---
        if (type === 'MOVE_UNITS') {
            payload.unitIds.forEach(unitId => {
                const unit = state.units.find(u => u.id === unitId);
                if (unit && unit.ownerId === playerId) {

                    const rawDest = payload.targetUnitId
                        ? (state.buildings.find(b => b.id === payload.targetUnitId) || state.units.find(u => u.id === payload.targetUnitId))
                        : { x: payload.targetX, y: payload.targetY };

                    if (rawDest) {
                        // FIX: If targeting a ghost building, set destination to center
                        let finalDest = { x: rawDest.x, y: rawDest.y };
                        const isConstructionFrame = rawDest.status === 'CONSTRUCTING';

                        if (isConstructionFrame && unit.type === 'builder') {
                            finalDest.x += 25;
                            finalDest.y += 25;
                        }

                        const path = Pathfinding.findPath({ x: unit.x, y: unit.y }, finalDest, state);

                        if (path && path.length > 0) {
                            unit.path = path;
                            unit.pathIndex = 0;
                            unit.targetX = path[0].x;
                            unit.targetY = path[0].y;
                            unit.isMoving = true;

                            if (isConstructionFrame && unit.type === 'builder') {
                                unit.status = 'MOVING_TO_BUILD';
                                unit.task = { type: 'CONSTRUCT', targetId: rawDest.id };
                            } else if (unit.stats?.damage > 0 && payload.targetUnitId) {
                                unit.status = 'ATTACKING';
                                unit.targetEntityId = payload.targetUnitId;
                                unit.task = null;
                            } else {
                                unit.status = 'MOVING';
                                unit.task = null;
                                unit.targetEntityId = null;
                            }
                        } else {
                            // Stop unit if path is genuinely impossible
                            unit.isMoving = false;
                            unit.path = null;
                            unit.targetX = unit.x;
                            unit.targetY = unit.y;
                            unit.status = 'IDLE';
                            unit.task = null;
                        }
                    }
                }
            });
        }

        // --- BUILD UNIT ---
        if (type === 'BUILD_UNIT') {
            const player = state.players.find(p => p.id === playerId);
            const b = state.buildings.find(b => b.id === payload.buildingId);
            if (player && b && b.status === 'READY' && player.resources.money >= UNIT_STATS[payload.unitType].cost) {
                player.resources.money -= UNIT_STATS[payload.unitType].cost;
                b.queue.push({ type: payload.unitType, progress: 0, totalTime: UNIT_STATS[payload.unitType].buildTime });
            }
        }

        // --- SET RALLY POINT ---
        if (type === 'SET_RALLY_POINT') {
            const b = state.buildings.find(b => b.id === payload.buildingId);
            if (b && b.ownerId === playerId) b.rallyPoint = { x: payload.x, y: payload.y };
        }

        // --- SELL/CANCEL BUILDING ---
        if (type === 'CANCEL_BUILDING' || type === 'SELL_BUILDING') {
            const idx = state.buildings.findIndex(b => b.id === payload.buildingId);
            const p = state.players.find(p => p.id === playerId);
            if (idx !== -1 && p) {
                const b = state.buildings[idx];
                const stats = BUILDING_STATS[b.type];
                p.resources.money += (type === 'CANCEL_BUILDING') ? stats.cost : Math.floor(stats.cost * 0.5);
                state.buildings.splice(idx, 1);
            }
        }
    });
};