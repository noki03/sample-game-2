import React, { useRef, useEffect, useCallback } from 'react';
import { useGameStore } from '../store/useGameStore';
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
        if (!canvasRef.current) return;
        const { width, height } = canvasRef.current;
        const { units, buildings, selectedUnitIds, effects } = gameState;

        const isValid = placementMode ? controls.checkPlacementValid(controls.mousePos.x - 25, controls.mousePos.y - 25) : true;

        ctx.clearRect(0, 0, width, height);
        GameRenderer.drawBackground(ctx, width, height);
        GameRenderer.drawBuildings(ctx, buildings, selectedUnitIds, selfPlayerId);
        GameRenderer.drawUnits(ctx, units, selectedUnitIds, selfPlayerId);
        GameRenderer.drawCombatEffects(ctx, effects);

        // Only draw Ripples, Selection Box, and Ghost in drawUI
        GameRenderer.drawUI(ctx, { ...controls, isValid, placementMode });
    }, [gameState, controls, selfPlayerId, placementMode]);

    useEffect(() => {
        const ctx = canvasRef.current.getContext('2d');
        const handleResize = () => {
            canvasRef.current.width = window.innerWidth;
            canvasRef.current.height = window.innerHeight - 180;
        };
        window.addEventListener('resize', handleResize);
        handleResize();

        let frame;
        const render = () => { draw(ctx); frame = requestAnimationFrame(render); };
        render();
        return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', handleResize); };
    }, [draw]);

    return (
        <canvas
            ref={canvasRef}
            onMouseDown={controls.handleMouseDown}
            onMouseMove={controls.handleMouseMove}
            onMouseUp={controls.handleMouseUp}
            onContextMenu={(e) => e.preventDefault()}
        />
    );
};

export default GameCanvas;