import { UNIT_STATS, BUILDING_STATS } from '../constants';

export const processCommands = (state, commands) => {
    commands.forEach(command => {
        const { type, payload, playerId } = command;

        if (type === 'PLACE_BUILDING') {
            const player = state.players.find(p => p.id === playerId);
            const stats = BUILDING_STATS[payload.buildingType];

            if (player && player.resources.money >= stats.cost) {
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
                    rallyPoint: { x: payload.x + 60, y: payload.y + 120 }, // Default spot in front
                });
            }
        }

        if (type === 'MOVE_UNITS') {
            payload.unitIds.forEach(unitId => {
                const unit = state.units.find(u => u.id === unitId);
                if (unit && unit.ownerId === playerId) {
                    if (!payload.targetUnitId) {
                        unit.targetX = payload.targetX;
                        unit.targetY = payload.targetY;
                        unit.isMoving = true;
                        unit.status = 'MOVING';
                        unit.targetEntityId = null;
                    } else if (unit.stats.damage > 0) {
                        unit.targetEntityId = payload.targetUnitId;
                        unit.status = 'ATTACKING';
                        unit.isMoving = false;
                    }
                }
            });
        }

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
    });
};