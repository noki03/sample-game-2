export const processConstruction = (gameState, delta) => {
    gameState.buildings.forEach(b => {
        if (b.status === 'CONSTRUCTING') {
            // Find a builder unit within "work range" of this building
            const assignedBuilder = gameState.units.find(u =>
                u.type === 'builder' &&
                u.task?.targetId === b.id &&
                Math.hypot(u.x - b.x, u.y - b.y) < 60 // Proximity check
            );

            if (assignedBuilder) {
                // Building grows based on time
                const progressPerFrame = (1 / b.buildTime) * delta;
                b.progress += progressPerFrame;
                b.health = b.maxHealth * b.progress;

                if (b.progress >= 1) {
                    b.status = 'READY';
                    b.progress = 1;
                    assignedBuilder.task = null; // Free the builder
                }
            }
        }
    });
};