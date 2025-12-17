// client/src/game/constants.js

// --- Unit Definitions ---

export const UNIT_STATS = {
    builder: { speed: 8, damage: 0, range: 10, maxHealth: 100, cost: 0, buildTime: 0, type: 'builder' },
    ranger: { speed: 7, damage: 10, range: 60, maxHealth: 50, cost: 200, buildTime: 100 },
    crusader: { speed: 5, damage: 30, range: 120, maxHealth: 250, cost: 800, buildTime: 150 },
};

export const BUILDING_STATS = {
    command_center: { name: "Command Center", cost: 0, maxHealth: 2000, power: 50, buildTime: 60 },
    supply_center: { cost: 1000, maxHealth: 1000, income: 50, power: -10, buildTime: 60 }, // 60 ticks = 1 sec
    barracks: { cost: 600, maxHealth: 800, income: 0, power: -10, buildTime: 120 },      // 120 ticks = 2 sec
    war_factory: { name: "War Factory", cost: 1500, maxHealth: 1200, power: -20, buildTime: 100 },
    power_generator: { name: "Power Generator", cost: 500, maxHealth: 600, power: 100, buildTime: 60 }
};


export const INITIAL_STATE = {
    gameId: 'match_001',
    tick: 0,
    status: 'PLAYING',
    players: [
        { id: 'self', resources: { money: 5000, power: 0 } }
    ],
    units: [
        { id: 100, ownerId: 'self', x: 200, y: 200, type: 'builder', health: 100, maxHealth: 100, stats: { speed: 5 } }
    ],
    buildings: [
        { id: 500, ownerId: 'self', x: 100, y: 100, type: 'command_center', health: 2000, maxHealth: 2000, status: 'READY' },
        // ADD AN ENEMY COMMAND CENTER so the game doesn't end instantly
        { id: 999, ownerId: 'enemy', x: 1000, y: 500, type: 'command_center', health: 2000, maxHealth: 2000, status: 'READY' }
    ],
    selectedUnitIds: []
};

export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 720;