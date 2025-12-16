// client/src/game/constants.js

// --- Unit Definitions ---
export const UNIT_STATS = {
    ranger: { speed: 10, damage: 15, range: 50, maxHealth: 50, cost: 200, buildTime: 50 }, // 50 ticks
    crusader: { speed: 10, damage: 25, range: 100, maxHealth: 200, cost: 700, buildTime: 150 }, // 150 ticks
}

// --- Initial Game State (Self-ID placeholder for testing) ---
export const INITIAL_STATE = {
    gameId: 'match_001',
    tick: 0,
    status: 'PLAYING',

    // Note: 'self' should be replaced by a real player ID from the server later
    players: [
        { id: 'self', name: 'General A', resources: { money: 5000, incomeRate: 15, power: 100 }, color: '#007bff' }
    ],

    // Start with a few units and buildings for testing movement
    units: [
        { id: 101, ownerId: 'self', x: 200, y: 300, health: 50, maxHealth: 50, type: 'ranger', targetX: 200, targetY: 300, isMoving: false, status: 'IDLE', stats: UNIT_STATS.ranger },
        { id: 102, ownerId: 'self', x: 250, y: 300, health: 200, maxHealth: 200, type: 'crusader', targetX: 250, targetY: 300, isMoving: false, status: 'IDLE', stats: UNIT_STATS.crusader },
    ],

    buildings: [
        { id: 501, ownerId: 'self', x: 100, y: 100, health: 500, maxHealth: 500, type: 'outpost', queue: [] },
        // ADD THIS: An enemy structure to destroy
        { id: 999, ownerId: 'enemy', x: 800, y: 500, health: 1000, maxHealth: 1000, type: 'reactor', queue: [] },
    ],

    selectedUnitIds: [], // What the player has selected
};

export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 720;