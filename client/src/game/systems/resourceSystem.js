import { BUILDING_STATS } from '../constants';

export const updateResources = (state) => {
    state.players.forEach(player => {
        const supplyCenters = state.buildings.filter(b =>
            b.ownerId === player.id &&
            b.type === 'supply_center' &&
            b.status === 'READY'
        );

        let totalPower = 0;
        state.buildings.filter(b => b.ownerId === player.id && b.status === 'READY').forEach(b => {
            totalPower += (BUILDING_STATS[b.type]?.power || 0);
        });
        player.resources.power = totalPower;

        if (state.tick % 20 === 0) {
            const income = supplyCenters.length * 50;
            player.resources.money += income;
        }
    });
};