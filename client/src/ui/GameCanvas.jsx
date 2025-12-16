// src/ui/GameCanvas.jsx

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { sendCommand } from '../network/SocketManager';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../game/constants';

const GameCanvas = () => {
    const gameState = useGameStore(state => state.gameState);
    const { units, buildings, selectedUnitIds } = gameState;
    const setSelectedUnits = useGameStore(state => state.setSelectedUnits);
    const selfPlayerId = useGameStore(state => state.getSelfPlayerId());

    const canvasRef = useRef(null);

    // --- Selection Box State ---
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [dragEnd, setDragEnd] = useState({ x: 0, y: 0 });

    const getClickedUnit = useCallback((clickX, clickY) => {
        return units.find(unit => {
            return Math.hypot(unit.x - clickX, unit.y - clickY) < 20 && unit.ownerId === selfPlayerId;
        });
    }, [units, selfPlayerId]);

    // --- Mouse Handlers ---

    const handleMouseDown = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // --- RIGHT CLICK: ISSUE COMMAND ---
        if (e.button === 2) {
            if (selectedUnitIds.length > 0) {
                // Check for Enemy Target (unit or building)
                const enemyTarget =
                    units.find(u => u.ownerId !== selfPlayerId && Math.hypot(u.x - x, u.y - y) < 20) ||
                    buildings.find(b => b.ownerId !== selfPlayerId &&
                        x >= b.x && x <= b.x + 50 &&
                        y >= b.y && y <= b.y + 50);

                if (enemyTarget) {
                    sendCommand('MOVE_UNITS', { unitIds: selectedUnitIds, targetUnitId: enemyTarget.id });
                } else {
                    sendCommand('MOVE_UNITS', { unitIds: selectedUnitIds, targetX: x, targetY: y });
                }
            }
            return; // Prevent selection logic from firing
        }

        // --- LEFT CLICK: START SELECTION ---
        if (e.button === 0) {
            setDragStart({ x, y });
            setDragEnd({ x, y });
            setIsDragging(true);
        }
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        const rect = canvasRef.current.getBoundingClientRect();
        setDragEnd({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
    };

    // Inside src/ui/GameCanvas.jsx

    const handleMouseUp = (e) => {
        if (e.button !== 0 || !isDragging) {
            setIsDragging(false);
            return;
        }

        setIsDragging(false);

        const rect = canvasRef.current.getBoundingClientRect();
        const endX = e.clientX - rect.left;
        const endY = e.clientY - rect.top;

        const left = Math.min(dragStart.x, endX);
        const right = Math.max(dragStart.x, endX);
        const top = Math.min(dragStart.y, endY);
        const bottom = Math.max(dragStart.y, endY);

        const dragWidth = right - left;
        const dragHeight = bottom - top;

        // If it's a drag, select multiple. If it's a click, select single.
        if (dragWidth > 5 || dragHeight > 5) {
            const foundIds = units
                .filter(u => u.ownerId === selfPlayerId)
                .filter(u => u.x >= left && u.x <= right && u.y >= top && u.y <= bottom)
                .map(u => u.id);
            setSelectedUnits(foundIds);
        } else {
            const ownUnit = getClickedUnit(endX, endY);
            setSelectedUnits(ownUnit ? [ownUnit.id] : []); // Clicking ground clears selection
        }
    };

    const drawGame = useCallback((ctx) => {
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = '#1e3f1e';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // 1. Draw Buildings
        buildings.forEach(b => {
            ctx.fillStyle = b.ownerId === selfPlayerId ? '#888' : '#662222';
            ctx.fillRect(b.x, b.y, 50, 50);

            // Health Bar
            ctx.fillStyle = '#440000';
            ctx.fillRect(b.x, b.y - 10, 50, 6);
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(b.x, b.y - 10, (b.health / b.maxHealth) * 50, 6);
        });

        // 2. Draw Units
        units.forEach(u => {
            const isSelected = selectedUnitIds.includes(u.id);
            ctx.fillStyle = u.ownerId === selfPlayerId ? '#007bff' : '#ff3333';
            ctx.beginPath();
            ctx.arc(u.x, u.y, 10, 0, Math.PI * 2);
            ctx.fill();

            if (isSelected) {
                ctx.strokeStyle = '#00ff00';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(u.x, u.y, 14, 0, Math.PI * 2);
                ctx.stroke();
            }

            // Health Bar
            ctx.fillStyle = '#440000';
            ctx.fillRect(u.x - 12, u.y + 14, 24, 4);
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(u.x - 12, u.y + 14, (u.health / u.maxHealth) * 24, 4);

            // Combat Tracer
            if (u.status === 'ATTACKING' && u.targetEntityId && !u.isMoving) {
                const target = units.find(t => t.id === u.targetEntityId) || buildings.find(t => t.id === u.targetEntityId);
                if (target) {
                    ctx.shadowBlur = 5;
                    ctx.shadowColor = "red";
                    ctx.strokeStyle = '#ffcc00';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(u.x, u.y);
                    const tx = target.x + (target.maxHealth >= 500 ? 25 : 0);
                    const ty = target.y + (target.maxHealth >= 500 ? 25 : 0);
                    ctx.lineTo(tx, ty);
                    ctx.stroke();
                    ctx.shadowBlur = 0;
                }
            }
        });

        // 3. Draw Selection Box
        if (isDragging) {
            ctx.strokeStyle = '#00ff00';
            ctx.setLineDash([5, 5]);
            ctx.lineWidth = 1;
            ctx.strokeRect(
                dragStart.x,
                dragStart.y,
                dragEnd.x - dragStart.x,
                dragEnd.y - dragStart.y
            );
            ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
            ctx.fillRect(
                dragStart.x,
                dragStart.y,
                dragEnd.x - dragStart.x,
                dragEnd.y - dragStart.y
            );
            ctx.setLineDash([]);
        }
    }, [units, buildings, selectedUnitIds, selfPlayerId, isDragging, dragStart, dragEnd]);

    useEffect(() => {
        const ctx = canvasRef.current.getContext('2d');
        let frame;
        const render = () => {
            drawGame(ctx);
            frame = requestAnimationFrame(render);
        };
        render();
        return () => cancelAnimationFrame(frame);
    }, [drawGame]);

    return (
        <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            // ADD THIS LINE:
            onContextMenu={(e) => e.preventDefault()}
            style={{ backgroundColor: '#000', display: 'block', margin: '0 auto', cursor: 'crosshair' }}
        />
    );
};

export default GameCanvas;