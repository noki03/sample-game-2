import React, { useRef, useEffect, useCallback } from 'react';
import { useGameStore } from '../store/useGameStore';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../game/constants';
import { useGameControls } from '../hooks/useGameControls';
import { GameRenderer } from '../game/renderer/GameRenderer';

const GameCanvas = () => {
    const canvasRef = useRef(null);
    const gameState = useGameStore(state => state.gameState);
    const selfPlayerId = useGameStore(state => state.getSelfPlayerId());
    const placementMode = useGameStore(state => state.placementMode);
    const setPlacementMode = useGameStore(state => state.setPlacementMode);
    const setSelectedUnits = useGameStore(state => state.setSelectedUnits);

    const controls = useGameControls(canvasRef, gameState, selfPlayerId, placementMode, setPlacementMode, setSelectedUnits);

    const draw = useCallback((ctx) => {
        const { units, buildings, selectedUnitIds, effects } = gameState;

        // Calculate validity here to pass into the UI renderer
        const isValid = placementMode ? controls.checkPlacementValid(controls.mousePos.x - 25, controls.mousePos.y - 25) : true;

        GameRenderer.drawBackground(ctx, CANVAS_WIDTH, CANVAS_HEIGHT);
        GameRenderer.drawBuildings(ctx, buildings, selectedUnitIds, selfPlayerId);
        GameRenderer.drawUnits(ctx, units, selectedUnitIds, selfPlayerId);
        GameRenderer.drawCombatEffects(ctx, effects);

        // Pass 'isValid' into drawUI
        GameRenderer.drawUI(ctx, {
            ...controls,
            selectedUnitIds,
            placementMode,
            isValid, // <--- New prop
            isHoveringEnemy: checkHover(controls.mousePos)
        });
    }, [gameState, controls, selfPlayerId, placementMode]);

    const checkHover = (pos) => {
        const { units, buildings } = gameState;
        return units.find(u => u.ownerId !== selfPlayerId && Math.hypot(u.x - pos.x, u.y - pos.y) < 20) ||
            buildings.find(b => b.ownerId !== selfPlayerId && pos.x >= b.x && pos.x <= b.x + 50 && pos.y >= b.y && pos.y <= b.y + 50);
    };

    useEffect(() => {
        const ctx = canvasRef.current.getContext('2d');
        let frame;
        const render = () => { draw(ctx); frame = requestAnimationFrame(render); };
        render();
        return () => cancelAnimationFrame(frame);
    }, [draw]);

    return (
        <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            onMouseDown={controls.handleMouseDown}
            onMouseMove={controls.handleMouseMove}
            onMouseUp={controls.handleMouseUp}
            onContextMenu={(e) => e.preventDefault()}
            style={{ backgroundColor: '#000', display: 'block', margin: '0 auto' }}
        />
    );
};

export default GameCanvas;