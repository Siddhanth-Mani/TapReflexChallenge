/**
 * Individual target entity.
 * Handles its own lifecycle, animation, and state.
 */
export class Target {
    constructor(x, y, radius, lifespan, type = 'normal') {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.maxLifespan = lifespan;
        this.life = lifespan;
        this.type = type;
        
        this.isDead = false;
        this.isHit = false;
        this.spawnScale = 0; // For pop-in effect
        
        // Visual properties
        this.color = this.getColorForType(type);
        this.icon = this.getIconForType(type);
    }

    getColorForType(type) {
        switch(type) {
            case 'speed': return '#00D9FF';
            case 'gold': return '#FFD700';
            case 'bomb': return '#FF4757';
            default: return '#F0F0FF';
        }
    }

    getIconForType(type) {
        switch(type) {
            case 'speed': return '💨';
            case 'gold': return '⭐';
            case 'bomb': return '💣';
            default: return '⚡';
        }
    }

    update(dt, gameSpeed) {
        // Pop-in animation
        if (this.spawnScale < 1) {
            this.spawnScale += dt * 8;
            if (this.spawnScale > 1) this.spawnScale = 1;
        }

        // Lifespan logic
        // Only good targets expire and cause life loss
        // Bombs just disappear safely if not tapped
        this.life -= dt;
        if (this.life <= 0) {
            this.isDead = true;
        }
    }

    draw(ctx, dpr) {
        if (this.isDead) return;

        const pulse = 1 + Math.sin(Date.now() * 0.01) * 0.05;
        const currentRadius = this.radius * this.spawnScale * pulse;
        const progress = this.life / this.maxLifespan;

        ctx.save();
        ctx.translate(this.x, this.y);

        // 1. Outer Glow
        const glow = ctx.createRadialGradient(0, 0, currentRadius * 0.5, 0, 0, currentRadius + 15 * dpr);
        glow.addColorStop(0, this.color + '66'); // 40% alpha
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, currentRadius + 15 * dpr, 0, Math.PI * 2);
        ctx.fill();

        // 2. Timer Arc
        if (this.type !== 'bomb') {
            ctx.beginPath();
            ctx.arc(0, 0, currentRadius + 5 * dpr, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
            ctx.strokeStyle = progress < 0.3 ? '#FF4757' : progress < 0.6 ? '#FFD700' : '#00D9FF';
            ctx.lineWidth = 3 * dpr;
            ctx.lineCap = 'round';
            ctx.stroke();
        }

        // 3. Main Circle (Glassmorphism look)
        const gradient = ctx.createRadialGradient(-currentRadius * 0.3, -currentRadius * 0.3, 0, 0, 0, currentRadius);
        gradient.addColorStop(0, 'rgba(255,255,255,0.4)');
        gradient.addColorStop(1, this.color);
        
        ctx.beginPath();
        ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.globalAlpha = 0.9;
        ctx.fill();

        // 4. Icon
        ctx.fillStyle = this.type === 'bomb' ? '#FFF' : '#12122A';
        ctx.font = `bold ${Math.round(currentRadius * 0.7)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.icon, 0, 2 * dpr);

        ctx.restore();
    }

    checkHit(px, py, dpr) {
        const dx = px - this.x;
        const dy = py - this.y;
        const hitRadius = this.radius + 15 * dpr;
        return (dx * dx + dy * dy) <= (hitRadius * hitRadius);
    }
}
