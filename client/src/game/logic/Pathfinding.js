// src/game/logic/Pathfinding.js

export const GRID_SIZE = 25;

export class Pathfinding {
    static getGridCoords(x, y) {
        return { col: Math.floor(x / GRID_SIZE), row: Math.floor(y / GRID_SIZE) };
    }

    static findPath(start, target, state) {
        if (this.hasLineOfSight(start, target, state)) {
            return [{ x: target.x, y: target.y }];
        }

        const startPos = this.getGridCoords(start.x, start.y);
        const endPos = this.getGridCoords(target.x, target.y);
        const openSet = [];
        const closedSet = new Set();

        openSet.push({ ...startPos, g: 0, h: this.heuristic(startPos, endPos), f: 0, parent: null });

        let iterations = 0;
        const MAX_ITERATIONS = 600; // Hard limit to prevent browser freeze

        while (openSet.length > 0) {
            iterations++;
            if (iterations > MAX_ITERATIONS) return null;

            let current = openSet.reduce((prev, curr) => prev.f < curr.f ? prev : curr);
            if (current.col === endPos.col && current.row === endPos.row) {
                const rawPath = this.reconstructPath(current, target);
                return this.simplifyPath(rawPath, state);
            }

            openSet.splice(openSet.indexOf(current), 1);
            closedSet.add(`${current.col},${current.row}`);

            for (let neighbor of this.getNeighbors(current)) {
                if (closedSet.has(`${neighbor.col},${neighbor.row}`) || this.isObstacle(neighbor, state)) continue;

                let gScore = current.g + 1;
                let neighborInOpen = openSet.find(n => n.col === neighbor.col && n.row === neighbor.row);

                if (!neighborInOpen || gScore < neighborInOpen.g) {
                    neighbor.g = gScore;
                    neighbor.h = this.heuristic(neighbor, endPos);
                    neighbor.f = neighbor.g + neighbor.h;
                    neighbor.parent = current;
                    if (!neighborInOpen) openSet.push(neighbor);
                }
            }
        }
        return null;
    }

    static simplifyPath(path, state) {
        if (path.length <= 2) return path;
        const simplified = [path[0]];
        let currentIdx = 0;
        while (currentIdx < path.length - 1) {
            let furthestVisible = currentIdx + 1;
            for (let i = path.length - 1; i > currentIdx + 1; i--) {
                if (this.hasLineOfSight(path[currentIdx], path[i], state)) {
                    furthestVisible = i;
                    break;
                }
            }
            simplified.push(path[furthestVisible]);
            currentIdx = furthestVisible;
        }
        return simplified;
    }

    static hasLineOfSight(start, end, state) {
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const dist = Math.hypot(dx, dy);
        const steps = Math.ceil(dist / 10);
        for (let i = 1; i < steps; i++) {
            const checkX = start.x + (dx * i) / steps;
            const checkY = start.y + (dy * i) / steps;
            if (this.isObstacle(this.getGridCoords(checkX, checkY), state)) return false;
        }
        return true;
    }

    static isObstacle(pos, state) {
        const x = pos.col * GRID_SIZE;
        const y = pos.row * GRID_SIZE;
        const padding = 2; // Allows units to thread narrow gaps

        return state.buildings.some(b =>
            b.status === 'READY' &&
            x + GRID_SIZE - padding > b.x &&
            x + padding < b.x + 50 &&
            y + GRID_SIZE - padding > b.y &&
            y + padding < b.y + 50
        );
    }

    static heuristic(a, b) { return Math.abs(a.col - b.col) + Math.abs(a.row - b.row); }
    static getNeighbors(n) { return [{ col: n.col + 1, row: n.row }, { col: n.col - 1, row: n.row }, { col: n.col, row: n.row + 1 }, { col: n.col, row: n.row - 1 }]; }
    static reconstructPath(node, finalTarget) {
        const path = [finalTarget];
        while (node.parent) {
            path.push({ x: node.col * GRID_SIZE + GRID_SIZE / 2, y: node.row * GRID_SIZE + GRID_SIZE / 2 });
            node = node.parent;
        }
        return path.reverse();
    }
}