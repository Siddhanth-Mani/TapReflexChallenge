import { Target } from '../entities/Target.js';

export class SpawnSystem {
    constructor(canvasWidth, canvasHeight, dpr) {
        this.W = canvasWidth;
        this.H = canvasHeight;
        this.dpr = dpr;
        
        this.timer = 0;
        this.targets = [];
    }

    update(dt, speedManager) {
        this.timer += dt;
        
        const interval = speedManager.getSpawnInterval();
        
        if (this.timer >= interval) {
            this.timer = 0;
            this.spawn(speedManager);
        }

        // Update existing targets
        for (let i = this.targets.length - 1; i >= 0; i--) {
            this.targets[i].update(dt, speedManager.getSpeed());
            if (this.targets[i].isDead) {
                // Handle timeout (lose life if not a bomb)
                const target = this.targets[i];
                this.targets.splice(i, 1);
                
                if (target.type !== 'bomb') {
                    return { type: 'timeout', target };
                }
            }
        }
        return null;
    }

    spawn(speedManager) {
        const speed = speedManager.getSpeed();
        const phase = speedManager.getPhase();
        
        // Target Type Distribution
        let type = 'normal';
        const rand = Math.random();
        
        if (phase >= 2) {
            if (rand < 0.12) type = 'bomb';
            else if (rand < 0.22) type = 'speed';
            else if (rand < 0.28) type = 'gold';
        }

        // Size decreases as speed increases
        const baseRadius = 32 * this.dpr;
        const radius = Math.max(18 * this.dpr, baseRadius - (speed - 1) * 2.5);
        
        // Screen safe area
        const margin = radius + 30 * this.dpr;
        const topMargin = 100 * this.dpr; // HUD clearance
        
        const x = margin + Math.random() * (this.W - margin * 2);
        const y = topMargin + margin + Math.random() * (this.H - topMargin - margin * 2);
        
        const lifespan = speedManager.getTargetLifespan();
        
        const newTarget = new Target(x, y, radius, lifespan, type);
        this.targets.push(newTarget);
    }

    draw(ctx) {
        this.targets.forEach(t => t.draw(ctx, this.dpr));
    }

    reset() {
        this.targets = [];
        this.timer = 0;
    }
}
