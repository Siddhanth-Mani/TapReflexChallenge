import { SpeedManager } from './SpeedManager.js';
import { SpawnSystem } from '../systems/SpawnSystem.js';
import { ScoreSystem } from '../systems/ScoreSystem.js';
import { ParticleSystem } from '../fx/ParticleSystem.js';

export class Game {
    constructor(canvas, fxCanvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.fxCanvas = fxCanvas;
        this.fxCtx = fxCanvas.getContext('2d');
        
        this.dpr = Math.min(window.devicePixelRatio || 1, 3);
        this.resize();

        // Initialize Systems
        this.speedManager = new SpeedManager();
        this.spawnSystem = new SpawnSystem(this.width, this.height, this.dpr);
        this.scoreSystem = new ScoreSystem();
        this.fx = new ParticleSystem(this.fxCtx, this.dpr);
        
        // State
        this.isPlaying = false;
        this.isPaused = false;
        this.lives = 3;
        this.lastTime = 0;
        this.shakeAmount = 0;
        this.ripples = [];
        this.blobs = this.initBlobs();
        
        // Audio
        this.audioCtx = null;
        this.audioEnabled = false;

        this.setupInput();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.width = window.innerWidth * this.dpr;
        this.height = window.innerHeight * this.dpr;
        this.canvas.width = this.fxCanvas.width = this.width;
        this.canvas.height = this.fxCanvas.height = this.height;
        if (this.spawnSystem) {
            this.spawnSystem.W = this.width;
            this.spawnSystem.H = this.height;
        }
    }

    initBlobs() {
        return [
            { x: Math.random(), y: Math.random(), r: 0.15, c: 'rgba(108, 99, 255, 0.08)', vx: 0.005, vy: 0.003 },
            { x: Math.random(), y: Math.random(), r: 0.2, c: 'rgba(0, 217, 255, 0.06)', vx: -0.004, vy: 0.005 },
            { x: Math.random(), y: Math.random(), r: 0.1, c: 'rgba(255, 215, 0, 0.04)', vx: 0.006, vy: -0.004 }
        ];
    }

    setupInput() {
        this.canvas.addEventListener('pointerdown', (e) => {
            if (!this.isPlaying || this.isPaused) return;
            const px = e.clientX * this.dpr;
            const py = e.clientY * this.dpr;
            this.createRipple(px, py);
            this.handleTap(px, py);
        });
    }

    createRipple(x, y) {
        this.ripples.push({ x, y, r: 0, a: 0.5 });
    }

    vibrate(pattern) {
        try { if (navigator.vibrate) navigator.vibrate(pattern); } catch(e) {}
    }

    initAudio() {
        if (this.audioEnabled) return;
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.audioCtx = new AudioCtx();
                this.audioEnabled = true;
            }
        } catch (e) { console.error('Audio fail', e); }
    }

    playTone(freq, dur, type = 'sine', vol = 0.1) {
        if (!this.audioEnabled || !this.audioCtx) return;
        try {
            if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
            const t = this.audioCtx.currentTime;
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, t);
            gain.gain.setValueAtTime(vol, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start(t);
            osc.stop(t + dur);
        } catch (e) {}
    }

    start() {
        this.initAudio();
        this.isPlaying = true;
        this.isPaused = false;
        this.lives = 3;
        this.speedManager.reset();
        this.spawnSystem.reset();
        this.scoreSystem.reset();
        this.fx.reset();
        this.lastTime = performance.now();
        this.loop(this.lastTime);
        
        this.onGameStateChange('start');
    }

    loop(now) {
        if (!this.isPlaying || this.isPaused) return;
        
        const dt = (now - this.lastTime) / 1000;
        this.lastTime = now;

        this.update(dt);
        this.draw();

        requestAnimationFrame((t) => this.loop(t));
    }

    update(dt) {
        // Cap dt to avoid huge jumps
        const frameDt = Math.min(dt, 0.1);
        
        this.speedManager.update(frameDt);
        this.scoreSystem.update(frameDt);
        this.fx.update(frameDt);

        // Update Ripples
        for (let i = this.ripples.length - 1; i >= 0; i--) {
            const r = this.ripples[i];
            r.r += frameDt * 400 * this.dpr;
            r.a -= frameDt * 0.8;
            if (r.a <= 0) this.ripples.splice(i, 1);
        }

        const spawnEvent = this.spawnSystem.update(frameDt, this.speedManager);
        if (spawnEvent && spawnEvent.type === 'timeout') {
            this.handleMiss(spawnEvent.target);
        }

        // Screen shake decay
        if (this.shakeAmount > 0) {
            this.shakeAmount *= 0.9;
            if (this.shakeAmount < 0.1) this.shakeAmount = 0;
        }
    }

    handleTap(x, y) {
        let hit = false;
        const targets = this.spawnSystem.targets;
        
        for (let i = targets.length - 1; i >= 0; i--) {
            const t = targets[i];
            if (t.checkHit(x, y, this.dpr)) {
                hit = true;
                this.processHit(t);
                targets.splice(i, 1);
                break;
            }
        }

        if (!hit) {
            this.handleBlankTap(x, y);
        }
    }

    processHit(target) {
        if (target.type === 'bomb') {
            this.lives--;
            this.shakeAmount = 15;
            this.scoreSystem.resetCombo();
            this.playTone(100, 0.4, 'sawtooth', 0.2);
            this.vibrate([100, 50, 100]);
            this.fx.emit(target.x, target.y, '#FF4757', 25);
            this.fx.spawnPopup(target.x, target.y, '💥 BOMB!', '#FF4757');
            if (this.lives <= 0) this.gameOver();
        } else {
            const pts = this.scoreSystem.addPoints(10, this.speedManager.getSpeed(), target.type);
            this.fx.emit(target.x, target.y, target.color, 15);
            this.fx.spawnPopup(target.x, target.y, `+${pts}`, target.color);
            this.vibrate(20);
            
            // Audio scaling with speed
            const pitch = 440 + (this.speedManager.getSpeed() * 100) + (this.scoreSystem.combo * 10);
            this.playTone(pitch, 0.1, 'sine', 0.15);
            
            if (this.scoreSystem.combo % 10 === 0) {
                this.playTone(pitch * 1.5, 0.2, 'sine', 0.2);
                this.fx.spawnPopup(target.x, target.y - 40 * this.dpr, `${this.scoreSystem.combo} COMBO!`, '#FFD700');
            }
        }
        this.onGameStateChange('hit');
    }

    handleMiss(target) {
        this.lives--;
        this.shakeAmount = 8;
        this.scoreSystem.resetCombo();
        this.playTone(150, 0.3, 'square', 0.1);
        this.vibrate(80);
        this.fx.spawnPopup(target.x, target.y, 'TIMEOUT', '#FF4757');
        if (this.lives <= 0) this.gameOver();
        this.onGameStateChange('miss');
    }

    handleBlankTap(x, y) {
        this.scoreSystem.resetCombo();
        this.fx.emit(x, y, '#666', 5);
        this.playTone(200, 0.05, 'sine', 0.05);
        this.onGameStateChange('miss');
    }

    gameOver() {
        this.isPlaying = false;
        const isNewBest = this.scoreSystem.checkNewBest();
        this.playTone(220, 0.5, 'sawtooth', 0.2);
        setTimeout(() => this.onGameStateChange('gameover', { isNewBest }), 500);
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.fxCtx.clearRect(0, 0, this.width, this.height);
        
        this.ctx.save();
        if (this.shakeAmount > 0) {
            const sx = (Math.random() - 0.5) * this.shakeAmount * this.dpr;
            const sy = (Math.random() - 0.5) * this.shakeAmount * this.dpr;
            this.ctx.translate(sx, sy);
        }

        // Draw Background
        this.drawBackground();

        // Draw Systems
        this.spawnSystem.draw(this.ctx);
        this.ctx.restore();

        // Draw Ripples
        this.drawRipples();

        this.fx.draw();
    }

    drawRipples() {
        this.fxCtx.save();
        this.ripples.forEach(r => {
            this.fxCtx.beginPath();
            this.fxCtx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
            this.fxCtx.strokeStyle = `rgba(255, 255, 255, ${r.a})`;
            this.fxCtx.lineWidth = 2 * this.dpr;
            this.fxCtx.stroke();
        });
        this.fxCtx.restore();
    }

    drawBackground() {
        const speed = this.speedManager.getSpeed();
        const pulse = Math.sin(Date.now() * 0.001 * speed) * 5;
        
        const g = this.ctx.createRadialGradient(
            this.width/2, this.height/2, 0, 
            this.width/2, this.height/2, this.width * (1 + pulse * 0.01)
        );
        g.addColorStop(0, '#1A1A3A');
        g.addColorStop(1, '#0A0A1A');
        this.ctx.fillStyle = g;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Parallax Blobs
        this.blobs.forEach(b => {
            b.x += b.vx * speed;
            b.y += b.vy * speed;
            if (b.x < 0 || b.x > 1) b.vx *= -1;
            if (b.y < 0 || b.y > 1) b.vy *= -1;
            
            this.ctx.beginPath();
            this.ctx.arc(b.x * this.width, b.y * this.height, b.r * this.width, 0, Math.PI * 2);
            this.ctx.fillStyle = b.c;
            this.ctx.fill();
        });
    }

    // Callback bridge to UI
    onGameStateChange(type, data) {}
}
