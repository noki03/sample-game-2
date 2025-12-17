export const GameRenderer = {
    drawBackground: (ctx, width, height) => {
        ctx.fillStyle = '#1e3f1e';
        ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.lineWidth = 1;
        for (let x = 0; x < width; x += 50) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
        }
        for (let y = 0; y < height; y += 50) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
        }
    },

    drawBuildings: (ctx, buildings, selectedUnitIds, selfPlayerId) => {
        const prodTypes = ['barracks', 'war_factory', 'command_center'];
        buildings.forEach(b => {
            const isSelected = selectedUnitIds.includes(b.id);
            const teamColor = b.ownerId === selfPlayerId ? '#007bff' : '#ff3333';

            if (b.status === 'CONSTRUCTING') {
                // --- ZERO HOUR CONSTRUCTION FRAME (SCAFFOLDING) ---
                // Draw dashed outline to represent a frame
                ctx.strokeStyle = '#888';
                ctx.setLineDash([4, 4]);
                ctx.lineWidth = 2;
                ctx.strokeRect(b.x, b.y, 50, 50);
                ctx.setLineDash([]);

                // Draw Progress Fill (Fills from bottom to top)
                const progressRatio = b.health / b.maxHealth;
                const progressHeight = 50 * progressRatio;
                ctx.fillStyle = 'rgba(100, 100, 100, 0.4)';
                ctx.fillRect(b.x, b.y + 50 - progressHeight, 50, progressHeight);
            } else {
                // --- COMPLETED BUILDING ---
                ctx.fillStyle = teamColor;
                ctx.fillRect(b.x, b.y, 50, 50);

                // Identification Icons (Greebles)
                ctx.strokeStyle = 'rgba(255,255,255,0.5)';
                ctx.lineWidth = 2;
                if (b.type === 'power_generator') {
                    ctx.beginPath(); ctx.moveTo(b.x + 15, b.y + 40); ctx.lineTo(b.x + 25, b.y + 10); ctx.lineTo(b.x + 35, b.y + 25); ctx.stroke();
                } else if (b.type === 'barracks') {
                    ctx.strokeRect(b.x + 12, b.y + 30, 8, 15); ctx.strokeRect(b.x + 30, b.y + 30, 8, 15);
                } else if (b.type === 'war_factory') {
                    ctx.strokeRect(b.x + 10, b.y + 20, 30, 25);
                    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(b.x + 10, b.y + 25 + (i * 7)); ctx.lineTo(b.x + 40, b.y + 25 + (i * 7)); ctx.stroke(); }
                } else if (b.type === 'supply_center') {
                    ctx.strokeRect(b.x + 15, b.y + 15, 20, 20); ctx.beginPath(); ctx.moveTo(b.x + 25, b.y + 15); ctx.lineTo(b.x + 25, b.y + 35); ctx.stroke();
                } else if (b.type === 'command_center') {
                    ctx.beginPath(); ctx.arc(b.x + 25, b.y + 25, 12, 0, Math.PI * 2); ctx.stroke();
                }
            }

            // Rally Point (Only for completed production buildings)
            if (isSelected && prodTypes.includes(b.type) && b.rallyPoint && b.status === 'READY') {
                ctx.beginPath();
                ctx.setLineDash([5, 5]);
                ctx.strokeStyle = 'rgba(0, 255, 0, 0.6)';
                ctx.moveTo(b.x + 25, b.y + 25);
                ctx.lineTo(b.rallyPoint.x, b.rallyPoint.y);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.fillStyle = '#00ff00';
                ctx.fillRect(b.rallyPoint.x - 3, b.rallyPoint.y - 3, 6, 6);
            }

            // Selection Bracket
            if (isSelected) {
                ctx.strokeStyle = '#00ff00';
                ctx.lineWidth = 2;
                ctx.strokeRect(b.x - 4, b.y - 4, 58, 58);
            }

            // Health Bar
            GameRenderer.drawHealthBar(ctx, b.x, b.y - 12, 50, 6, b.health / b.maxHealth, b.status === 'CONSTRUCTING' ? '#ffff00' : '#00ff00');
        });
    },

    drawUnits: (ctx, units, selectedUnitIds, selfPlayerId) => {
        units.forEach(u => {
            const isSelected = selectedUnitIds.includes(u.id);
            ctx.fillStyle = u.ownerId === selfPlayerId ? '#007bff' : '#ff3333';

            // Visual Distinction for Builders
            if (u.type === 'builder') {
                ctx.fillRect(u.x - 8, u.y - 8, 16, 16); // Square for builders

                // --- WORKING VISUAL CUE ---
                // If builder is constructing, add an orange "working" ring
                if (u.status === 'CONSTRUCTING') {
                    ctx.strokeStyle = '#ffa500';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(u.x, u.y, 18, 0, Math.PI * 2);
                    ctx.stroke();
                }
            } else {
                ctx.beginPath(); // Circle for combat units
                ctx.arc(u.x, u.y, 10, 0, Math.PI * 2);
                ctx.fill();
            }

            // Unit Selection Circle/Square
            if (isSelected) {
                ctx.strokeStyle = '#00ff00';
                ctx.lineWidth = 2;
                ctx.beginPath();
                if (u.type === 'builder') {
                    ctx.strokeRect(u.x - 11, u.y - 11, 22, 22);
                } else {
                    ctx.arc(u.x, u.y, 14, 0, Math.PI * 2);
                    ctx.stroke();
                }
            }

            // Unit Health Bar
            GameRenderer.drawHealthBar(ctx, u.x - 12, u.y + 14, 24, 4, u.health / u.maxHealth, '#00ff00');
        });
    },

    drawCombatEffects: (ctx, effects) => {
        if (!effects) return;
        effects.forEach(fx => {
            if (fx.type === 'TRACER') {
                ctx.beginPath();
                ctx.strokeStyle = fx.color || '#ffffff';
                ctx.lineWidth = 1.5;
                ctx.moveTo(fx.fromX, fx.fromY);
                ctx.lineTo(fx.toX, fx.toY);
                ctx.stroke();

                // Muzzle/Impact flash
                ctx.fillStyle = '#ffaa00';
                ctx.beginPath();
                ctx.arc(fx.toX, fx.toY, 3 + Math.random() * 3, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    },

    drawHealthBar: (ctx, x, y, w, h, percent, color) => {
        ctx.fillStyle = '#440000';
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = color;
        ctx.fillRect(x, y, w * Math.max(0, percent), h);
    },

    drawUI: (ctx, { isDragging, dragStart, dragEnd, ripples, placementMode, mousePos, isValid }) => {
        // Selection Box
        if (isDragging) {
            ctx.strokeStyle = '#00ff00';
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(dragStart.x, dragStart.y, dragEnd.x - dragStart.x, dragEnd.y - dragStart.y);
            ctx.setLineDash([]);
        }

        // Right-click Ripples
        ripples.forEach(r => {
            ctx.strokeStyle = `rgba(0, 255, 0, ${r.alpha})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(r.x, r.y, 20 * (1.5 - r.alpha), 0, Math.PI * 2);
            ctx.stroke();
        });

        // Building Ghost Placement
        if (placementMode) {
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = isValid ? '#00ff00' : '#ff0000';
            ctx.fillRect(mousePos.x - 25, mousePos.y - 25, 50, 50);
            ctx.globalAlpha = 1.0;
            ctx.strokeStyle = isValid ? '#00ff00' : '#ff0000';
            ctx.lineWidth = 2;
            ctx.strokeRect(mousePos.x - 25, mousePos.y - 25, 50, 50);
        }
    }
};