// client/src/ui/GameCanvas.jsx

import React, { useRef, useEffect, useCallback } from 'react';
// We need the state to know what to draw
import { useGameStore } from '../store/useGameStore';

const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;

const GameCanvas = () => {
    // 1. Get the current state
    const { units, buildings, selectedUnitIds } = useGameStore(state => state.gameState);

    // 2. We use a ref to connect the component to the actual DOM canvas element
    const canvasRef = useRef(null);

    // 3. The Core Drawing Function (Pure Drawing Logic)
    const drawGame = useCallback((ctx) => {
        // Clear the entire canvas on every frame
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // --- Draw Map Background (Simplified) ---
        ctx.fillStyle = '#1e3f1e'; // Dark green terrain
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // --- Draw Buildings ---
        buildings.forEach(building => {
            const isSelected = selectedUnitIds.includes(building.id);

            // Draw the structure (simple square)
            ctx.fillStyle = isSelected ? '#fff' : '#888';
            ctx.fillRect(building.x, building.y, 50, 50);

            // Draw a label
            ctx.fillStyle = '#fff';
            ctx.fillText(building.type, building.x, building.y - 5);
        });

        // --- Draw Units ---
        units.forEach(unit => {
            const isSelected = selectedUnitIds.includes(unit.id);
            const size = 10;

            // Determine color based on owner (we'll need player colors later)
            ctx.fillStyle = unit.ownerId === 'self' ? '#007bff' : '#ff0000';

            // Draw the unit (simple circle for a tank/infantry placeholder)
            ctx.beginPath();
            ctx.arc(unit.x, unit.y, size, 0, Math.PI * 2);
            ctx.fill();

            // If selected, draw a selection circle
            if (isSelected) {
                ctx.strokeStyle = '#00ff00';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(unit.x, unit.y, size + 4, 0, Math.PI * 2);
                ctx.stroke();
            }

            // Draw health bar placeholder
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(unit.x - size, unit.y + size + 2, 2 * size, 3);
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(unit.x - size, unit.y + size + 2, (unit.health / unit.maxHealth) * 2 * size, 3);

            // Draw movement target (if moving)
            if (unit.isMoving) {
                ctx.strokeStyle = '#ffff00';
                ctx.setLineDash([5, 5]); // Dashed line
                ctx.beginPath();
                ctx.moveTo(unit.x, unit.y);
                ctx.lineTo(unit.targetX, unit.targetY);
                ctx.stroke();
                ctx.setLineDash([]); // Reset line style
            }
        });

    }, [units, buildings, selectedUnitIds]); // Dependencies: Redraw only if state changes

    // 4. The Render Loop (Uses requestAnimationFrame)
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        // The function that draws and requests the next frame
        const render = () => {
            // Draw using the data retrieved from the Zustand store
            drawGame(ctx);
            // Request the next frame for smooth animation
            animationFrameId = window.requestAnimationFrame(render);
        };

        // Start the loop
        render();

        // Cleanup function: stop the loop when the component unmounts
        return () => {
            window.cancelAnimationFrame(animationFrameId);
        };
    }, [drawGame]); // Dependency on drawGame ensures this useEffect knows when to update its logic

    // 5. Render the canvas element
    return (
        <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            style={{
                border: '2px solid #00ff00',
                backgroundColor: '#333'
            }}
        />
    );
};

export default GameCanvas;