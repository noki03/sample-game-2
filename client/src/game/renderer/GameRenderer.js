export const GameRenderer = {
    drawBackground: (ctx, width, height) => {
        ctx.fillStyle = '#1e3f1e';
        ctx.fillRect(0, 0, width, height);
    },

    drawBuildings: (ctx, buildings, selectedUnitIds, selfPlayerId) => {
        buildings.forEach(b => {
            const isSelected = selectedUnitIds.includes(b.id);
            let color = b.ownerId === selfPlayerId ? (b.status === 'CONSTRUCTING' ? '#444' : '#888') : '#662222';

            if (b.status === 'READY' && b.ownerId === selfPlayerId) {
                const colors = { command_center: '#5555ff', supply_center: '#ffcc00', power_generator: '#00cccc', barracks: '#447744', war_factory: '#aa6622' };
                color = colors[b.type] || color;
            }

            ctx.fillStyle = color;
            ctx.fillRect(b.x, b.y, 50, 50);

            if (isSelected && b.rallyPoint && b.status === 'READY') {
                ctx.beginPath();
                ctx.setLineDash([5, 5]);
                ctx.strokeStyle = 'rgba(0, 255, 0, 0.6)';
                ctx.moveTo(b.x + 25, b.y + 25);
                ctx.lineTo(b.rallyPoint.x, b.rallyPoint.y);
                ctx.stroke();
                ctx.setLineDash([]);
            }

            if (isSelected) {
                ctx.strokeStyle = '#00ff00';
                ctx.lineWidth = 2;
                ctx.strokeRect(b.x - 4, b.y - 4, 58, 58);
            }

            // HP Bar
            GameRenderer.drawHealthBar(ctx, b.x, b.y - 12, 50, 6, b.health / b.maxHealth, b.status === 'CONSTRUCTING' ? '#ffff00' : '#00ff00');
        });
    },

    drawUnits: (ctx, units, selectedUnitIds, selfPlayerId) => {
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
            GameRenderer.drawHealthBar(ctx, u.x - 12, u.y + 14, 24, 4, u.health / u.maxHealth, '#00ff00');
        });
    },

    drawHealthBar: (ctx, x, y, w, h, percent, color) => {
        ctx.fillStyle = '#440000';
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = color;
        ctx.fillRect(x, y, w * percent, h);
    },

    drawUI: (ctx, { isDragging, dragStart, dragEnd, ripples, placementMode, mousePos, isHoveringEnemy, selectedUnitIds }) => {
        // Drag Box
        if (isDragging) {
            ctx.strokeStyle = '#00ff00';
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(dragStart.x, dragStart.y, dragEnd.x - dragStart.x, dragEnd.y - dragStart.y);
            ctx.setLineDash([]);
        }

        // Ripples
        ripples.forEach(r => {
            ctx.strokeStyle = `rgba(0, 255, 0, ${r.alpha})`;
            ctx.beginPath();
            ctx.arc(r.x, r.y, 20 * (1.5 - r.alpha), 0, Math.PI * 2);
            ctx.stroke();
        });

        // Ghost Building
        if (placementMode) {
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(mousePos.x - 25, mousePos.y - 25, 50, 50);
            ctx.globalAlpha = 1.0;
        }

        // Software Cursor
        const cursorColor = isHoveringEnemy ? '#ff3333' : (selectedUnitIds.length > 0 ? '#00ff00' : '#ffffff');
        ctx.strokeStyle = cursorColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(mousePos.x, mousePos.y, 8, 0, Math.PI * 2);
        ctx.moveTo(mousePos.x, mousePos.y - 14); ctx.lineTo(mousePos.x, mousePos.y - 6);
        ctx.moveTo(mousePos.x, mousePos.y + 14); ctx.lineTo(mousePos.x, mousePos.y + 6);
        ctx.moveTo(mousePos.x - 14, mousePos.y); ctx.lineTo(mousePos.x - 6, mousePos.y);
        ctx.moveTo(mousePos.x + 14, mousePos.y); ctx.lineTo(mousePos.x + 6, mousePos.y);
        ctx.stroke();
    }
};