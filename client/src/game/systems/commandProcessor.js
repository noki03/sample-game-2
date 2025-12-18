import { UNIT_STATS, BUILDING_STATS } from '../constants';
import { Pathfinding } from '../logic/Pathfinding';

let idCounter = 0;
const generateId = (state) => {
    idCounter++;
    return `ent_${state.tick}_${idCounter}`; // Deterministic ID generation
};

export const processCommands = (state, commands) => {
    idCounter = 0;
    commands.forEach(command => {
        const { type, payload, playerId } = command;

        if (type === 'PLACE_BUILDING') {
            const player = state.players.find(p => p.id === playerId);
            const stats = BUILDING_STATS[payload.buildingType];
            if (player && player.resources.money >= stats.cost) {
                const newId = generateId(state);
                player.resources.money -= stats.cost;
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

        if (type === 'MOVE_UNITS') {
            payload.unitIds.forEach(unitId => {
                const unit = state.units.find(u => u.id === unitId);
                if (unit && unit.ownerId === playerId) {
                    const rawDest = payload.targetUnitId
                        ? (state.buildings.find(b => b.id === payload.targetUnitId) || state.units.find(u => u.id === payload.targetUnitId))
                        : { x: payload.targetX, y: payload.targetY };

                    if (rawDest) {
                        let finalPos = { x: rawDest.x, y: rawDest.y };
                        const isGhost = rawDest.status === 'CONSTRUCTING';
                        if (isGhost && unit.type === 'builder') { finalPos.x += 25; finalPos.y += 25; }

                        const path = Pathfinding.findPath({ x: unit.x, y: unit.y }, finalPos, state);
                        if (path) {
                            unit.path = path; unit.pathIndex = 0;
                            unit.targetX = path[0].x; unit.targetY = path[0].y;
                            unit.isMoving = true;
                            if (isGhost && unit.type === 'builder') {
                                unit.status = 'MOVING_TO_BUILD';
                                unit.task = { type: 'CONSTRUCT', targetId: rawDest.id };
                            } else if (unit.stats?.damage > 0 && payload.targetUnitId) {
                                unit.status = 'ATTACKING'; unit.targetEntityId = payload.targetUnitId;
                            } else {
                                unit.status = 'MOVING'; unit.task = null;
                            }
                        } else {
                            unit.isMoving = false; unit.status = 'IDLE';
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