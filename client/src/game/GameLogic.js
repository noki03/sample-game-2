// client/src/game/GameLogic.js
import { processCommands } from './systems/commandProcessor';
import { updateResources } from './systems/resourceSystem';
import { updateConstruction, updateProduction } from './systems/productionSystem';
import { updateUnitMovement, resolveUnitCollisions } from './systems/movementSystem';
import { updateCombat } from './systems/combatSystem';

const cleanupState = (state) => {
    state.units = state.units.filter(u => u.health > 0);
    state.buildings = state.buildings.filter(b => b.health > 0);
};

const checkWinConditions = (state) => {
    if (state.tick < 100) return;
    const selfPlayer = state.players[0];
    if (!selfPlayer || selfPlayer.id === 'self') return;

    const ownAssets = state.buildings.filter(b => b.ownerId === selfPlayer.id).length +
        state.units.filter(u => u.ownerId === selfPlayer.id).length;
    const enemyAssets = state.buildings.filter(b => b.ownerId !== selfPlayer.id).length +
        state.units.filter(u => u.ownerId !== selfPlayer.id).length;

    if (ownAssets === 0) state.status = 'DEFEAT';
    else if (enemyAssets === 0) state.status = 'VICTORY';
};

export const runDeterministicEngine = (oldState, commands, newTick) => {
    let newState = JSON.parse(JSON.stringify(oldState));
    newState.tick = newTick;

    // Orchestrate Systems
    processCommands(newState, commands);
    updateResources(newState);
    updateConstruction(newState);
    updateProduction(newState);
    updateUnitMovement(newState);
    resolveUnitCollisions(newState);
    updateCombat(newState);

    cleanupState(newState);
    checkWinConditions(newState);

    return newState;
};