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

    const placementMode = useGameStore(state => state.placementMode);
    const setPlacementMode = useGameStore(state => state.setPlacementMode);

    const canvasRef = useRef(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [isHoveringEnemy, setIsHoveringEnemy] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [dragEnd, setDragEnd] = useState({ x: 0, y: 0 });
    const [ripples, setRipples] = useState([]);

    const handleMouseMove = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setMousePos({ x, y });

        if (isDragging) { setDragEnd({ x, y }); return; }

        if (selectedUnitIds.length > 0) {
            const enemy = units.find(u => u.ownerId !== selfPlayerId && Math.hypot(u.x - x, u.y - y) < 20) ||
                buildings.find(b => b.ownerId !== selfPlayerId && x >= b.x && x <= b.x + 50 && y >= b.y && y <= b.y + 50);
            setIsHoveringEnemy(!!enemy);
        }
    };

    const handleMouseDown = (e) => {
        const { x, y } = mousePos;

        if (placementMode && e.button === 0) {
            sendCommand('PLACE_BUILDING', { buildingType: placementMode, x: x - 25, y: y - 25 });
            setPlacementMode(null);
            return;
        }

        if (e.button === 2) {
            if (placementMode) { setPlacementMode(null); }
            else if (selectedUnitIds.length > 0) {
                const target = units.find(u => u.ownerId !== selfPlayerId && Math.hypot(u.x - x, u.y - y) < 20) ||
                    buildings.find(b => b.ownerId !== selfPlayerId && x >= b.x && x <= b.x + 50 && y >= b.y && y <= b.y + 50);
                if (target) sendCommand('MOVE_UNITS', { unitIds: selectedUnitIds, targetUnitId: target.id });
                else sendCommand('MOVE_UNITS', { unitIds: selectedUnitIds, targetX: x, targetY: y });

                const id = Date.now();
                setRipples(prev => [...prev, { id, x, y, alpha: 1.0 }]);
                setTimeout(() => setRipples(p => p.filter(r => r.id !== id)), 600);
            }
            return;
        }

        if (e.button === 0) {
            setDragStart({ x, y }); setDragEnd({ x, y }); setIsDragging(true);
        }
    };

    const handleMouseUp = (e) => {
        if (e.button !== 0 || !isDragging) { setIsDragging(false); return; }
        setIsDragging(false);
        const left = Math.min(dragStart.x, dragEnd.x); const right = Math.max(dragStart.x, dragEnd.x);
        const top = Math.min(dragStart.y, dragEnd.y); const bottom = Math.max(dragStart.y, dragEnd.y);

        if (right - left > 5) {
            const ids = units.filter(u => u.ownerId === selfPlayerId && u.x >= left && u.x <= right && u.y >= top && u.y <= bottom).map(u => u.id);
            setSelectedUnits(ids);
        } else {
            const unit = units.find(u => Math.hypot(u.x - dragEnd.x, u.y - dragEnd.y) < 20 && u.ownerId === selfPlayerId);
            setSelectedUnits(unit ? [unit.id] : []);
        }
    };

    const drawGame = useCallback((ctx) => {
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = '#1e3f1e'; ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        buildings.forEach(b => {
            ctx.fillStyle = b.ownerId === selfPlayerId ? (b.status === 'CONSTRUCTING' ? '#444' : '#888') : '#662222';
            ctx.fillRect(b.x, b.y, 50, 50);
            ctx.fillStyle = '#440000'; ctx.fillRect(b.x, b.y - 12, 50, 6);
            ctx.fillStyle = b.status === 'CONSTRUCTING' ? '#ffff00' : '#00ff00';
            ctx.fillRect(b.x, b.y - 12, (b.health / b.maxHealth) * 50, 6);
        });

        units.forEach(u => {
            const isSelected = selectedUnitIds.includes(u.id);
            ctx.fillStyle = u.ownerId === selfPlayerId ? '#007bff' : '#ff3333';
            ctx.beginPath(); ctx.arc(u.x, u.y, 10, 0, Math.PI * 2); ctx.fill();
            if (isSelected) {
                ctx.strokeStyle = '#00ff00'; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.arc(u.x, u.y, 14, 0, Math.PI * 2); ctx.stroke();
            }
            ctx.fillStyle = '#440000'; ctx.fillRect(u.x - 12, u.y + 14, 24, 4);
            ctx.fillStyle = '#00ff00'; ctx.fillRect(u.x - 12, u.y + 14, (u.health / u.maxHealth) * 24, 4);

            if (u.status === 'ATTACKING' && u.targetEntityId && !u.isMoving) {
                const target = [...units, ...buildings].find(t => t.id === u.targetEntityId);
                if (target) {
                    ctx.strokeStyle = '#ffcc00'; ctx.lineWidth = 2; ctx.beginPath();
                    ctx.moveTo(u.x, u.y); ctx.lineTo(target.x + 25, target.y + 25); ctx.stroke();
                }
            }
        });

        if (isDragging) {
            ctx.strokeStyle = '#00ff00'; ctx.setLineDash([5, 5]);
            ctx.strokeRect(dragStart.x, dragStart.y, dragEnd.x - dragStart.x, dragEnd.y - dragStart.y);
            ctx.setLineDash([]);
        }

        ripples.forEach(r => {
            ctx.strokeStyle = `rgba(0, 255, 0, ${r.alpha})`; ctx.beginPath();
            ctx.arc(r.x, r.y, 20 * (1.5 - r.alpha), 0, Math.PI * 2); ctx.stroke();
            r.alpha -= 0.03;
        });

        if (placementMode) {
            ctx.globalAlpha = 0.5; ctx.fillStyle = '#00ff00';
            ctx.fillRect(mousePos.x - 25, mousePos.y - 25, 50, 50); ctx.globalAlpha = 1.0;
        }

        // Software Cursor - Fixed the 'y is not defined' error here
        const color = isHoveringEnemy ? '#ff3333' : (selectedUnitIds.length > 0 ? '#00ff00' : '#ffffff');
        ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath();
        ctx.arc(mousePos.x, mousePos.y, 8, 0, Math.PI * 2);
        ctx.moveTo(mousePos.x, mousePos.y - 14); ctx.lineTo(mousePos.x, mousePos.y - 6);
        ctx.moveTo(mousePos.x, mousePos.y + 14); ctx.lineTo(mousePos.x, mousePos.y + 6);
        ctx.moveTo(mousePos.x - 14, mousePos.y); ctx.lineTo(mousePos.x - 6, mousePos.y);
        ctx.moveTo(mousePos.x + 14, mousePos.y); ctx.lineTo(mousePos.x + 6, mousePos.y);
        ctx.stroke();

    }, [units, buildings, selectedUnitIds, selfPlayerId, isDragging, dragStart, dragEnd, ripples, mousePos, isHoveringEnemy, placementMode]);

    useEffect(() => {
        const ctx = canvasRef.current.getContext('2d');
        let frame;
        const render = () => { drawGame(ctx); frame = requestAnimationFrame(render); };
        render(); return () => cancelAnimationFrame(frame);
    }, [drawGame]);

    return (
        <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT}
            onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}
            onContextMenu={(e) => e.preventDefault()} style={{ backgroundColor: '#000', display: 'block', margin: '0 auto' }} />
    );
};

export default GameCanvas;