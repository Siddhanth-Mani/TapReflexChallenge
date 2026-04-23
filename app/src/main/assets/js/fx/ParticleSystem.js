export class ParticleSystem {
    constructor(ctx, dpr) {
        this.ctx = ctx;
        this.dpr = dpr;
        this.particles = [];
        this.popups = [];
    }

    emit(x, y, color, count = 12) {
        for (let i = 0; i < count; i++) {
            const angle = Math.PI * 2 * Math.random();
            const speed = (1.5 + Math.random() * 4) * this.dpr;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: (1.5 + Math.random() * 2.5) * this.dpr,
                life: 1.0,
                decay: 0.02 + Math.random() * 0.03,
                color
            });
        }
    }

    spawnPopup(x, y, text, color) {
        this.popups.push({
            x, y, text, color,
            life: 1.0,
            vy: -2 * this.dpr,
            scale: 1.5
        });
    }

    update(dt) {
        // Update Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1 * this.dpr; // Gravity
            p.life -= p.decay;
            if (p.life <= 0) this.particles.splice(i, 1);
        }

        // Update Popups
        for (let i = this.popups.length - 1; i >= 0; i--) {
            const p = this.popups[i];
            p.y += p.vy;
            p.vy *= 0.95;
            p.life -= 0.025;
            p.scale += (1.0 - p.scale) * 0.1;
            if (p.life <= 0) this.popups.splice(i, 1);
        }
    }

    draw() {
        // Draw Particles
        this.particles.forEach(p => {
            this.ctx.globalAlpha = p.life;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius * p.life, 0, Math.PI * 2);
            this.ctx.fillStyle = p.color;
            this.ctx.fill();
        });

        // Draw Popups
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.popups.forEach(p => {
            this.ctx.globalAlpha = p.life;
            this.ctx.font = `bold ${Math.round(18 * this.dpr * p.scale)}px 'Space Grotesk', sans-serif`;
            this.ctx.fillStyle = p.color;
            this.ctx.fillText(p.text, p.x, p.y);
        });

        this.ctx.globalAlpha = 1.0;
    }

    reset() {
        this.particles = [];
        this.popups = [];
    }
}
