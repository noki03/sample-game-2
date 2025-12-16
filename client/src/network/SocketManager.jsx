// client/src/SocketManager.jsx
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
            console.log('Connected to server via Socket.io');
        });

        // The critical synchronization event
        socket.on('tick_commands', ({ tick, commands }) => {
            // 1. Run the deterministic logic
            // Pass the current state from the store and the new commands/tick
            const newState = runDeterministicEngine(gameState, commands, tick); // <--- Updated call

            // 2. Update the central React store
            updateGameState(newState);
        });

        return () => {
            socket.off('connect');
            socket.off('tick_commands');
        };
    }, [gameState, updateGameState]); // Dependencies ensure we always have the latest state

    return (
        // Children will be the rest of your app components
        <>{children}</>
    );
};

// Function to send commands from any component
export const sendCommand = (commandType, payload) => {
    socket.emit('player_command', {
        type: commandType,
        payload: payload
    });
};