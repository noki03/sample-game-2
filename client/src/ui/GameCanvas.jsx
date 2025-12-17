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

    const checkHover = useCallback((pos) => {
        const { units, buildings } = gameState;
        return units.find(u => u.ownerId !== selfPlayerId && Math.hypot(u.x - pos.x, u.y - pos.y) < 20) ||
            buildings.find(b => b.ownerId !== selfPlayerId && pos.x >= b.x && pos.x <= b.x + 50 && pos.y >= b.y && pos.y <= b.y + 50);
    }, [gameState, selfPlayerId]);

    const draw = useCallback((ctx) => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const { units, buildings, selectedUnitIds, effects } = gameState;
        const isValid = placementMode ? controls.checkPlacementValid(controls.mousePos.x - 25, controls.mousePos.y - 25) : true;

        ctx.clearRect(0, 0, w, h);
        GameRenderer.drawBackground(ctx, w, h);
        GameRenderer.drawBuildings(ctx, buildings, selectedUnitIds, selfPlayerId);
        GameRenderer.drawUnits(ctx, units, selectedUnitIds, selfPlayerId);
        GameRenderer.drawCombatEffects(ctx, effects);

        GameRenderer.drawUI(ctx, {
            ...controls,
            selectedUnitIds,
            placementMode,
            isValid,
            isHoveringEnemy: checkHover(controls.mousePos)
        });
    }, [gameState, controls, selfPlayerId, placementMode, checkHover]);

    useEffect(() => {
        const ctx = canvasRef.current.getContext('2d');
        const handleResize = () => {
            canvasRef.current.width = window.innerWidth;
            canvasRef.current.height = window.innerHeight;
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        let frame;
        const render = () => { draw(ctx); frame = requestAnimationFrame(render); };
        render();
        return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', handleResize); };
    }, [draw]);

    useEffect(() => {
        const handleGlobalMouseMove = (e) => controls.handleMouseMove(e);
        window.addEventListener('mousemove', handleGlobalMouseMove);
        return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
    }, [controls]);

    return (
        <div className="game-view-wrapper" style={{ position: 'relative', width: '100vw', height: '100vh' }}>
            <canvas ref={canvasRef} />
            <div
                className="input-layer"
                onMouseDown={controls.handleMouseDown}
                onMouseUp={controls.handleMouseUp}
                onContextMenu={(e) => e.preventDefault()}
            />
        </div>
    );
};

export default GameCanvas;