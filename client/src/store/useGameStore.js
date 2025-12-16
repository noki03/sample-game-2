// client/src/store/useGameStore.js

import { create } from 'zustand';
import { INITIAL_STATE } from '../game/constants';

export const useGameStore = create((set, get) => ({
    gameState: INITIAL_STATE,

    updateGameState: (newGameState) => set({ gameState: newGameState }),

    // Top-level action to change game status
    setGameStatus: (status) => set(state => ({
        gameState: { ...state.gameState, status }
    })),

    setSelectedUnits: (ids) => set(state => ({
        gameState: {
            ...state.gameState,
            selectedUnitIds: ids
        }
    })),

    getSelfPlayerId: () => {
        const state = get().gameState;
        return state.players[0]?.id || 'self';
    }
}));