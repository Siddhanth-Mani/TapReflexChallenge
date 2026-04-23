export class HUD {
    constructor() {
        this.scoreEl = document.getElementById('h-score');
        this.comboEl = document.getElementById('h-combo');
        this.livesEl = document.getElementById('h-lives');
        this.speedEl = document.getElementById('h-speed');
        
        this.menuEl = document.getElementById('menu');
        this.gameOverEl = document.getElementById('gameover');
        this.pauseEl = document.getElementById('pause');
        
        this.finalScoreEl = document.getElementById('go-score');
        this.finalBestEl = document.getElementById('go-best');
        this.newBestEl = document.getElementById('new-best');
    }

    update(game) {
        const newScore = Math.floor(game.scoreSystem.displayScore);
        if (this.scoreEl.textContent !== String(newScore)) {
            this.scoreEl.textContent = newScore;
            this.bump(this.scoreEl);
        }
        
        const newCombo = `×${game.scoreSystem.combo}`;
        if (this.comboEl.textContent !== newCombo && game.scoreSystem.combo > 0) {
            this.comboEl.textContent = newCombo;
            this.bump(this.comboEl);
        } else {
            this.comboEl.textContent = newCombo;
        }
        
        // Multiplier colors
        const m = game.scoreSystem.multiplier;
        this.comboEl.style.color = m >= 4 ? '#FFD700' : m >= 2 ? '#00D9FF' : '#FFF';
        
        this.speedEl.textContent = `SPEED: ${game.speedManager.getSpeed().toFixed(1)}x`;

        let hearts = '';
        for (let i = 0; i < 3; i++) {
            hearts += i < game.lives ? '❤️' : '🖤';
        }
        this.livesEl.textContent = hearts;
    }

    showScreen(id, data = {}) {
        [this.menuEl, this.gameOverEl, this.pauseEl].forEach(el => el.style.display = 'none');
        
        const target = document.getElementById(id);
        if (target) {
            target.style.display = 'flex';
            
            if (id === 'gameover') {
                this.finalScoreEl.textContent = data.score;
                this.finalBestEl.textContent = `BEST: ${data.best}`;
                this.newBestEl.style.display = data.isNewBest ? 'block' : 'none';
            }
        }
    }

    hideAll() {
        [this.menuEl, this.gameOverEl, this.pauseEl].forEach(el => el.style.display = 'none');
    }

    bump(el) {
        el.classList.remove('bump');
        void el.offsetWidth; // Trigger reflow
        el.classList.add('bump');
        setTimeout(() => el.classList.remove('bump'), 100);
    }
}
