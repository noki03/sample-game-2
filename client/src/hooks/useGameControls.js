import { useState, useCallback } from 'react';
import { sendCommand } from '../network/SocketManager';

export const useGameControls = (canvasRef, gameState, selfPlayerId, placementMode, setPlacementMode, setSelectedUnits) => {
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [dragEnd, setDragEnd] = useState({ x: 0, y: 0 });
    const [ripples, setRipples] = useState([]);

    const getCanvasCoords = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    };

    const handleMouseMove = (e) => {
        const coords = getCanvasCoords(e);
        setMousePos(coords);
        if (isDragging) setDragEnd(coords);
    };

    const handleMouseDown = (e) => {
        const coords = getCanvasCoords(e);
        const { x, y } = coords;

        if (placementMode && e.button === 0) {
            sendCommand('PLACE_BUILDING', { buildingType: placementMode, x: x - 25, y: y - 25 });
            setPlacementMode(null);
            return;
        }

        if (e.button === 2) { // Right Click
            if (placementMode) {
                setPlacementMode(null);
            } else {
                const { selectedUnitIds, buildings, units } = gameState;
                const selectedBuilding = buildings.find(b => selectedUnitIds.includes(b.id) && b.ownerId === selfPlayerId);

                if (selectedBuilding && selectedUnitIds.length === 1) {
                    sendCommand('SET_RALLY_POINT', { buildingId: selectedBuilding.id, x, y });
                } else if (selectedUnitIds.length > 0) {
                    const target = units.find(u => u.ownerId !== selfPlayerId && Math.hypot(u.x - x, u.y - y) < 20) ||
                        buildings.find(b => b.ownerId !== selfPlayerId && x >= b.x && x <= b.x + 50 && y >= b.y && y <= b.y + 50);

                    if (target) sendCommand('MOVE_UNITS', { unitIds: selectedUnitIds, targetUnitId: target.id });
                    else sendCommand('MOVE_UNITS', { unitIds: selectedUnitIds, targetX: x, targetY: y });
                }

                // Add Ripple
                const id = Date.now();
                setRipples(prev => [...prev, { id, x, y, alpha: 1.0 }]);
                setTimeout(() => setRipples(p => p.filter(r => r.id !== id)), 600);
            }
            return;
        }

        if (e.button === 0) {
            setDragStart(coords);
            setDragEnd(coords);
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

        const { units, buildings } = gameState;

        if (right - left > 5) {
            const ids = units.filter(u => u.ownerId === selfPlayerId && u.x >= left && u.x <= right && u.y >= top && u.y <= bottom).map(u => u.id);
            setSelectedUnits(ids);
        } else {
            const unit = units.find(u => Math.hypot(u.x - dragEnd.x, u.y - dragEnd.y) < 20 && u.ownerId === selfPlayerId);
            if (unit) {
                setSelectedUnits([unit.id]);
            } else {
                const bldg = buildings.find(b => dragEnd.x >= b.x && dragEnd.x <= b.x + 50 && dragEnd.y >= b.y && dragEnd.y <= b.y + 50 && b.ownerId === selfPlayerId);
                setSelectedUnits(bldg ? [bldg.id] : []);
            }
        }
    };

    return { mousePos, isDragging, dragStart, dragEnd, ripples, handleMouseMove, handleMouseDown, handleMouseUp };
};