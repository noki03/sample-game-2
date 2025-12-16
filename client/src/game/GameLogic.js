// client/src/GameLogic.js

/**
 * The deterministic engine that runs every tick.
 * It calculates the new game state based on the old state and player commands.
 * @param {object} oldState - The game state from the previous tick.
 * @param {Array<object>} commands - List of commands received from the server.
 * @param {number} newTick - The current tick number.
 * @returns {object} The new, updated game state.
 */
export const runDeterministicEngine = (oldState, commands, newTick) => {
    // 1. Start by copying the old state to a new state for modification
    let newState = JSON.parse(JSON.stringify(oldState));
    newState.tick = newTick;

    // 2. Process Input Commands (Must happen first)
    processCommands(newState, commands);

    // 3. Resource Generation
    updateResources(newState);

    // 4. Unit Movement (The first major calculation)
    updateUnitMovement(newState);

    // 5. Combat Calculations (Next step: targeting and damage)
    // updateCombat(newState); 

    // 6. Production & Building (Next step: build queue progress)
    // updateProduction(newState); 

    // 7. Cleanup (Remove dead units/buildings)
    // cleanupState(newState);

    return newState;
};

const processCommands = (state, commands) => {
    commands.forEach(command => {
        const { type, payload } = command;

        switch (type) {
            case 'MOVE_UNITS':
                payload.unitIds.forEach(unitId => {
                    const unit = state.units.find(u => u.id === unitId);
                    if (unit && unit.ownerId === command.playerId) {
                        unit.targetX = payload.targetX;
                        unit.targetY = payload.targetY;
                        unit.isMoving = true;
                        unit.status = 'MOVING';
                        unit.targetEntityId = null; // Clear attack target
                    }
                });
                break;

            case 'BUILD_UNIT':
                // Logic to add unitType to building queue
                break;

            // ... other commands (PLACE_BUILDING, etc.)
        }
    });
}

// Note: This is simplified math for linear movement.
const updateUnitMovement = (state) => {
    state.units.forEach(unit => {
        if (!unit.isMoving || unit.status !== 'MOVING') return;

        // 1. Calculate the distance in X and Y
        const dx = unit.targetX - unit.x;
        const dy = unit.targetY - unit.y;

        // Calculate the straight-line distance (using Pythagorean theorem)
        const distance = Math.sqrt(dx * dx + dy * dy);

        // 2. Check for arrival (within a small tolerance)
        const arrivalTolerance = 5;
        if (distance <= arrivalTolerance) {
            unit.x = unit.targetX;
            unit.y = unit.targetY;
            unit.isMoving = false;
            unit.status = 'IDLE';
            return;
        }

        // 3. Calculate the unit's speed per tick
        // We'll hardcode speed for now, or use unit.stats.speed
        const speed = unit.stats ? unit.stats.speed : 5;

        // 4. Calculate the movement vector (normalize dx/dy)
        // This gives us the direction (a vector of length 1)
        const vectorX = dx / distance;
        const vectorY = dy / distance;

        // 5. Update position based on speed and direction
        unit.x += vectorX * speed;
        unit.y += vectorY * speed;
    });
};

const updateResources = (state) => {
    state.players.forEach(player => {
        // Find the full player object from the state
        const playerState = state.players.find(p => p.id === player.id);
        if (playerState) {
            // Money += IncomeRate (e.g., +15 per tick from Supply Centers)
            playerState.resources.money += playerState.resources.incomeRate;
        }
    });
};