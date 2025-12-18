// src/game/logic/Pathfinding.js

export const GRID_SIZE = 25; // 25px grid provides a balance of precision and speed

export class Pathfinding {
    static getGridCoords(x, y) {
        return { col: Math.floor(x / GRID_SIZE), row: Math.floor(y / GRID_SIZE) };
    }

    /**
     * Finds a path from start to target.
     * Returns an array of waypoints or null if no valid path exists.
     */
    static findPath(start, target, state) {
        // 1. Line-of-Sight Optimization: If clear, move directly to target
        if (this.hasLineOfSight(start, target, state)) {
            return [{ x: target.x, y: target.y }];
        }

        const startPos = this.getGridCoords(start.x, start.y);
        const endPos = this.getGridCoords(target.x, target.y);

        const openSet = [];
        const closedSet = new Set();

        const startNode = {
            ...startPos, g: 0, h: this.heuristic(startPos, endPos),
            f: 0, parent: null
        };
        startNode.f = startNode.h;
        openSet.push(startNode);

        // --- SAFETY: Prevent Infinite Loops ---
        let iterations = 0;
        const MAX_ITERATIONS = 600; // Hard limit to prevent game freeze

        while (openSet.length > 0) {
            iterations++;
            if (iterations > MAX_ITERATIONS) {
                return null; // Exit gracefully if search is too complex
            }

            let current = openSet.reduce((prev, curr) => prev.f < curr.f ? prev : curr);

            if (current.col === endPos.col && current.row === endPos.row) {
                const rawPath = this.reconstructPath(current, target);
                return this.simplifyPath(rawPath, state); // Smooth the path waypoints
            }

            openSet.splice(openSet.indexOf(current), 1);
            closedSet.add(`${current.col},${current.row}`);

            for (let neighbor of this.getNeighbors(current)) {
                if (closedSet.has(`${neighbor.col},${neighbor.row}`) ||
                    this.isObstacle(neighbor, state)) continue;

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
        return null; // No path found
    }

    /**
     * Path Smoothing: Skips unnecessary waypoints for a direct "free move" feel.
     */
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

    /**
     * Line-of-Sight Check: Determines if a straight path is clear of obstacles.
     */
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

    /**
     * Obstacle Check: Restricts movement based on "READY" buildings and unit size.
     */
    static isObstacle(pos, state) {
        const x = pos.col * GRID_SIZE;
        const y = pos.row * GRID_SIZE;

        // REDUCED: Smaller padding allows units to move through narrower gaps
        const unitRadiusPadding = 2;

        return state.buildings.some(b =>
            b.status === 'READY' &&
            x + GRID_SIZE - unitRadiusPadding > b.x &&
            x + unitRadiusPadding < b.x + 50 &&
            y + GRID_SIZE - unitRadiusPadding > b.y &&
            y + unitRadiusPadding < b.y + 50
        );
    }

    static heuristic(a, b) {
        return Math.abs(a.col - b.col) + Math.abs(a.row - b.row);
    }

    static getNeighbors(node) {
        return [
            { col: node.col + 1, row: node.row }, { col: node.col - 1, row: node.row },
            { col: node.col, row: node.row + 1 }, { col: node.col, row: node.row - 1 }
        ];
    }

    static reconstructPath(node, finalTarget) {
        const path = [finalTarget];
        while (node.parent) {
            path.push({ x: node.col * GRID_SIZE + GRID_SIZE / 2, y: node.row * GRID_SIZE + GRID_SIZE / 2 });
            node = node.parent;
        }
        return path.reverse();
    }
}