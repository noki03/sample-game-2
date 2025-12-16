// client/src/store.js

import { create } from 'zustand';

// Initial dummy game state based on our design
const INITIAL_STATE = {
    gameId: 'match_001',
    tick: 0,
    players: [], // Will be populated by the server connection
    units: [{ id: 101, ownerId: 'self', x: 200, y: 300, health: 100, type: 'tank' }],
    buildings: [{ id: 501, ownerId: 'self', x: 100, y: 100, type: 'outpost' }],
    selectedUnitIds: [], // What the player has clicked on
};

export const useGameStore = create((set) => ({
    // The entire game state
    gameState: INITIAL_STATE,

    // Action to run the deterministic engine (will be called by the SocketManager)
    updateGameState: (newGameState) => set({ gameState: newGameState }),

    // Action to select units
    setSelectedUnits: (ids) => set(state => ({
        gameState: {
            ...state.gameState,
            selectedUnitIds: ids
        }
    }))
}));