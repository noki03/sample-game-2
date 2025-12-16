// client/src/ui/GameCanvas.jsx

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

    // --- State Management ---
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [isHoveringEnemy, setIsHoveringEnemy] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [dragEnd, setDragEnd] = useState({ x: 0, y: 0 });
    const [ripples, setRipples] = useState([]);

    const addRipple = useCallback((x, y) => {
        const id = Date.now();
        setRipples(prev => [...prev, { id, x, y, alpha: 1.0 }]);
        setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 600);
    }, []);

    // --- Interaction Handlers ---
    const handleMouseMove = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setMousePos({ x, y });

        if (isDragging) {
            setDragEnd({ x, y });
            return;
        }

        if (selectedUnitIds.length > 0) {
            const enemy =
                units.find(u => u.ownerId !== selfPlayerId && Math.hypot(u.x - x, u.y - y) < 20) ||
                buildings.find(b => b.ownerId !== selfPlayerId && x >= b.x && x <= b.x + 50 && y >= b.y && y <= b.y + 50);
            setIsHoveringEnemy(!!enemy);
        } else {
            setIsHoveringEnemy(false);
        }
    };

    const handleMouseDown = (e) => {
        const { x, y } = mousePos;
        if (e.button === 2) { // Right Click: Command
            if (selectedUnitIds.length > 0) {
                addRipple(x, y);
                const target = units.find(u => u.ownerId !== selfPlayerId && Math.hypot(u.x - x, u.y - y) < 20) ||
                    buildings.find(b => b.ownerId !== selfPlayerId && x >= b.x && x <= b.x + 50 && y >= b.y && y <= b.y + 50);

                if (target) {
                    sendCommand('MOVE_UNITS', { unitIds: selectedUnitIds, targetUnitId: target.id });
                } else {
                    sendCommand('MOVE_UNITS', { unitIds: selectedUnitIds, targetX: x, targetY: y });
                }
            }
            return;
        }
        if (e.button === 0) { // Left Click: Start Selection
            setDragStart({ x, y });
            setDragEnd({ x, y });
            setIsDragging(true);
        }
    };

    const handleMouseUp = (e) => {
        if (e.button !== 0 || !isDragging) { setIsDragging(false); return; }
        setIsDragging(false);
        const left = Math.min(dragStart.x, dragEnd.x);
        const right = Math.max(dragStart.x, dragEnd.x);
        const top = Math.min(dragStart.y, dragEnd.y);
        const bottom = Math.max(dragStart.y, dragEnd.y);

        if (right - left > 5 || bottom - top > 5) {
            const foundIds = units.filter(u => u.ownerId === selfPlayerId && u.x >= left && u.x <= right && u.y >= top && u.y <= bottom).map(u => u.id);
            setSelectedUnits(foundIds);
        } else {
            const ownUnit = units.find(u => Math.hypot(u.x - dragEnd.x, u.y - dragEnd.y) < 20 && u.ownerId === selfPlayerId);
            setSelectedUnits(ownUnit ? [ownUnit.id] : []);
        }
    };

    // --- Drawing Helper Functions ---
    const drawCursor = (ctx, x, y) => {
        const color = isHoveringEnemy ? '#ff3333' : (selectedUnitIds.length > 0 ? '#00ff00' : '#ffffff');
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.moveTo(x, y - 14); ctx.lineTo(x, y - 6);
        ctx.moveTo(x, y + 14); ctx.lineTo(x, y + 6);
        ctx.moveTo(x - 14, y); ctx.lineTo(x - 6, y);
        ctx.moveTo(x + 14, y); ctx.lineTo(x + 6, y);
        ctx.stroke();
        ctx.restore();
    };

    const drawGame = useCallback((ctx) => {
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = '#1e3f1e';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // 1. Draw Buildings
        buildings.forEach(b => {
            ctx.fillStyle = b.ownerId === selfPlayerId ? '#888' : '#662222';
            ctx.fillRect(b.x, b.y, 50, 50);
            // Building HP Bar
            ctx.fillStyle = '#440000';
            ctx.fillRect(b.x, b.y - 12, 50, 6);
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(b.x, b.y - 12, (b.health / b.maxHealth) * 50, 6);
        });

        // 2. Draw Units & Combat
        units.forEach(u => {
            const isSelected = selectedUnitIds.includes(u.id);
            ctx.fillStyle = u.ownerId === selfPlayerId ? '#007bff' : '#ff3333';
            ctx.beginPath(); ctx.arc(u.x, u.y, 10, 0, Math.PI * 2); ctx.fill();

            if (isSelected) {
                ctx.strokeStyle = '#00ff00'; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.arc(u.x, u.y, 14, 0, Math.PI * 2); ctx.stroke();
            }

            // Unit HP Bar
            ctx.fillStyle = '#440000';
            ctx.fillRect(u.x - 12, u.y + 14, 24, 4);
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(u.x - 12, u.y + 14, (u.health / u.maxHealth) * 24, 4);

            // Combat Lasers/Sparks
            if (u.status === 'ATTACKING' && u.targetEntityId && !u.isMoving) {
                const target = units.find(t => t.id === u.targetEntityId) || buildings.find(t => t.id === u.targetEntityId);
                if (target) {
                    ctx.save();
                    ctx.shadowBlur = 5; ctx.shadowColor = "red";
                    ctx.strokeStyle = '#ffcc00'; ctx.lineWidth = 2;
                    ctx.beginPath(); ctx.moveTo(u.x, u.y);
                    const tx = target.x + (target.maxHealth >= 500 ? 25 : 0);
                    const ty = target.y + (target.maxHealth >= 500 ? 25 : 0);
                    ctx.lineTo(tx, ty);
                    ctx.stroke();
                    // Impact Spark
                    ctx.fillStyle = '#ffffff';
                    ctx.beginPath(); ctx.arc(tx + (Math.random() - 0.5) * 10, ty + (Math.random() - 0.5) * 10, 3, 0, Math.PI * 2); ctx.fill();
                    ctx.restore();
                }
            }
        });

        // 3. Selection Box
        if (isDragging) {
            ctx.strokeStyle = '#00ff00'; ctx.setLineDash([5, 5]);
            ctx.strokeRect(dragStart.x, dragStart.y, dragEnd.x - dragStart.x, dragEnd.y - dragStart.y);
            ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
            ctx.fillRect(dragStart.x, dragStart.y, dragEnd.x - dragStart.x, dragEnd.y - dragStart.y);
            ctx.setLineDash([]);
        }

        // 4. Ripples
        ripples.forEach(r => {
            ctx.strokeStyle = `rgba(0, 255, 0, ${r.alpha})`; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(r.x, r.y, 20 * (1.5 - r.alpha), 0, Math.PI * 2); ctx.stroke();
            r.alpha -= 0.03;
        });

        // 5. Software Cursor (Always Top)
        drawCursor(ctx, mousePos.x, mousePos.y);

    }, [units, buildings, selectedUnitIds, selfPlayerId, isDragging, dragStart, dragEnd, ripples, mousePos, isHoveringEnemy]);

    useEffect(() => {
        const ctx = canvasRef.current.getContext('2d');
        let frame;
        const render = () => { drawGame(ctx); frame = requestAnimationFrame(render); };
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
            onContextMenu={(e) => e.preventDefault()}
            style={{ backgroundColor: '#000', display: 'block', margin: '0 auto' }}
        />
    );
};

export default GameCanvas;