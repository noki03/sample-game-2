// client/src/store/useGameStore.js

import { create } from 'zustand';
import { INITIAL_STATE } from '../game/constants';

export const useGameStore = create((set, get) => ({ // Add 'get' here
    gameState: INITIAL_STATE,

    updateGameState: (newGameState) => set({ gameState: newGameState }),

    setSelectedUnits: (ids) => set(state => ({
        gameState: {
            ...state.gameState,
            selectedUnitIds: ids // This now accepts [101, 102, 105...]
        }
    })),

    // UPDATE: Get the ID from the current live state
    getSelfPlayerId: () => {
        const state = get().gameState;
        return state.players[0]?.id || 'self';
    }


}));