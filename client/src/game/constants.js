// client/src/game/constants.js

// --- Unit Definitions ---
export const UNIT_STATS = {
    builder: { speed: 8, damage: 0, range: 10, maxHealth: 100, cost: 200, buildTime: 100, type: 'builder' },
    ranger: { speed: 7, damage: 10, range: 60, maxHealth: 50, cost: 200, buildTime: 100 },
    crusader: { speed: 5, damage: 30, range: 120, maxHealth: 250, cost: 800, buildTime: 150 },
};

// --- Building Definitions ---
export const BUILDING_STATS = {
    command_center: { name: "Command Center", cost: 0, maxHealth: 2000, power: 50, buildTime: 60 },
    supply_center: { name: "Supply Center", cost: 1000, maxHealth: 1000, income: 50, power: -10, buildTime: 60 },
    barracks: { name: "Barracks", cost: 600, maxHealth: 800, income: 0, power: -10, buildTime: 120 },
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
        {
            id: 100,
            ownerId: 'self',
            x: 400,
            y: 400,
            type: 'builder',
            health: 100,
            maxHealth: 100,
            status: 'IDLE',
            // Synchronized stats to prevent deprecated data issues
            stats: { ...UNIT_STATS.builder }
        }
    ],
    buildings: [
        {
            id: 500,
            ownerId: 'self',
            x: 100,
            y: 100,
            type: 'command_center',
            health: 2000,
            maxHealth: 2000,
            status: 'READY',
            queue: [],
            rallyPoint: { x: 125, y: 180 }
        },
        {
            id: 501,
            ownerId: 'self',
            x: 200,
            y: 100,
            type: 'barracks',
            health: 800,
            maxHealth: 800,
            status: 'READY',
            queue: [],
            rallyPoint: { x: 225, y: 180 }
        },
        {
            id: 999,
            ownerId: 'enemy',
            x: 1000,
            y: 500,
            type: 'command_center',
            health: 2000,
            maxHealth: 2000,
            status: 'READY'
        }
    ],
    selectedUnitIds: []
};
