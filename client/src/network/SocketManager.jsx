// client/src/network/SocketManager.jsx

import React, { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useGameStore } from '../store/useGameStore';
import { runDeterministicEngine } from '../game/GameLogic';

const socket = io('http://localhost:3001');

export const SocketManager = ({ children }) => {
    const gameState = useGameStore(state => state.gameState);
    const updateGameState = useGameStore(state => state.updateGameState);

    useEffect(() => {
        socket.on('connect', () => {
            console.log('My Socket ID:', socket.id);

            const currentState = useGameStore.getState().gameState;
            const updatedState = JSON.parse(JSON.stringify(currentState));

            // CRITICAL: Update the ID of the player and the starting buildings
            updatedState.players[0].id = socket.id;
            updatedState.buildings.forEach(b => {
                if (b.ownerId === 'self') b.ownerId = socket.id;
            });
            updatedState.units.forEach(u => {
                if (u.ownerId === 'self') u.ownerId = socket.id;
            });

            updateGameState(updatedState);
        });

        socket.on('tick_commands', ({ tick, commands }) => {
            // Now when this runs, the IDs will match!
            const newState = runDeterministicEngine(gameState, commands, tick);
            updateGameState(newState);
        });

        // ... cleanup ...
    }, [gameState, updateGameState]);

    return <>{children}</>;
};

// Function exposed to other components to send input to the server
export const sendCommand = (commandType, payload) => {
    socket.emit('player_command', {
        type: commandType,
        payload: payload
    });
};