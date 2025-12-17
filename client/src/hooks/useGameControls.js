import { useEffect, useState, useCallback } from 'react';
import { sendCommand } from '../network/SocketManager';

export const useGameControls = (canvasRef, gameState, selfPlayerId, placementMode, setPlacementMode, setSelectedUnits) => {
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [dragEnd, setDragEnd] = useState({ x: 0, y: 0 });
    const [ripples, setRipples] = useState([]);

    const getCanvasCoords = (e) => ({ x: e.clientX, y: e.clientY });

    const checkPlacementValid = useCallback((x, y) => {
        if (!gameState) return false;
        const worldHeight = window.innerHeight - 180;
        if (x < 0 || y < 0 || x + 50 > window.innerWidth || y + 50 > worldHeight) return false;

        const bOverlap = gameState.buildings.some(b =>
            !(x + 50 < b.x || x > b.x + 50 || y + 50 < b.y || y > b.y + 50)
        );
        const uOverlap = gameState.units.some(u =>
            u.x >= x && u.x <= x + 50 && u.y >= y && u.y <= y + 50
        );
        return !bOverlap && !uOverlap;
    }, [gameState]);

    const handleMouseMove = useCallback((e) => {
        const coords = getCanvasCoords(e);
        setMousePos(coords);
        if (isDragging) setDragEnd(coords);
    }, [isDragging]);

    const handleMouseDown = (e) => {
        const coords = getCanvasCoords(e);
        const { x, y } = coords;
        if (y > window.innerHeight - 180) return;

        if (placementMode && e.button === 0) {
            if (checkPlacementValid(x - 25, y - 25)) {
                sendCommand('PLACE_BUILDING', { buildingType: placementMode, x: x - 25, y: y - 25 });
                setPlacementMode(null);
            }
            return;
        }

        if (e.button === 2) {
            const { selectedUnitIds, buildings, units } = gameState;
            const selectedBuilding = buildings.find(b => selectedUnitIds.includes(b.id) && b.ownerId === selfPlayerId);
            const prodTypes = ['barracks', 'war_factory', 'command_center'];

            if (selectedBuilding && selectedUnitIds.length === 1 && prodTypes.includes(selectedBuilding.type)) {
                sendCommand('SET_RALLY_POINT', { buildingId: selectedBuilding.id, x, y });
            } else if (selectedUnitIds.length > 0) {
                const target = units.find(u => u.ownerId !== selfPlayerId && Math.hypot(u.x - x, u.y - y) < 20) ||
                    buildings.find(b => b.ownerId !== selfPlayerId && x >= b.x && x <= b.x + 50 && y >= b.y && y <= b.y + 50);
                if (target) sendCommand('MOVE_UNITS', { unitIds: selectedUnitIds, targetUnitId: target.id });
                else sendCommand('MOVE_UNITS', { unitIds: selectedUnitIds, targetX: x, targetY: y });
            }
            setRipples(prev => [...prev, { id: Date.now(), x, y, alpha: 1.0 }]);
            return;
        }
        if (e.button === 0) { setDragStart(coords); setDragEnd(coords); setIsDragging(true); }
    };

    const handleMouseUp = (e) => {
        if (e.button !== 0 || !isDragging) { setIsDragging(false); return; }
        setIsDragging(false);
        const coords = getCanvasCoords(e);
        const { units, buildings } = gameState;
        const left = Math.min(dragStart.x, coords.x);
        const right = Math.max(dragStart.x, coords.x);
        const top = Math.min(dragStart.y, coords.y);
        const bottom = Math.max(dragStart.y, coords.y);

        if (right - left > 5) {
            const ids = units.filter(u => u.ownerId === selfPlayerId && u.x >= left && u.x <= right && u.y >= top && u.y <= bottom).map(u => u.id);
            setSelectedUnits(ids);
        } else {
            const unit = units.find(u => Math.hypot(u.x - coords.x, u.y - coords.y) < 20 && u.ownerId === selfPlayerId);
            if (unit) setSelectedUnits([unit.id]);
            else {
                const bldg = buildings.find(b => coords.x >= b.x && coords.x <= b.x + 50 && coords.y >= b.y && coords.y <= b.y + 50 && b.ownerId === selfPlayerId);
                setSelectedUnits(bldg ? [bldg.id] : []);
            }
        }
    };

    useEffect(() => {
        const interval = setInterval(() => {
            setRipples(prev => prev.map(r => ({ ...r, alpha: r.alpha - 0.05 })).filter(r => r.alpha > 0));
        }, 30);
        return () => clearInterval(interval);
    }, []);

    return { mousePos, isDragging, dragStart, dragEnd, ripples, handleMouseMove, handleMouseDown, handleMouseUp, checkPlacementValid };
};