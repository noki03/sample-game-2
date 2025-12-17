// client/src/store/useGameStore.js
import { create } from 'zustand';
import { INITIAL_STATE } from '../game/constants';

export const useGameStore = create((set, get) => ({
    gameState: INITIAL_STATE,
    placementMode: null, // Stores the type of building being placed (e.g., 'barracks')
    notification: null,
    pendingAction: null,

    updateGameState: (newGameState) => set({ gameState: newGameState }),

    setPlacementMode: (type) => set({ placementMode: type }),

    setSelectedUnits: (ids) => set(state => ({
        gameState: { ...state.gameState, selectedUnitIds: ids }
    })),

    getSelfPlayerId: () => {
        const state = get().gameState;
        return state.players[0]?.id || 'self';
    },

    setNotification: (message) => {
        set({ notification: message });
        // Automatically clear after 3 seconds
        setTimeout(() => set({ notification: null }), 3000);
    },
    setPendingAction: (action) => set({ pendingAction: action }),
    clearPendingAction: () => set({ pendingAction: null }),
}));