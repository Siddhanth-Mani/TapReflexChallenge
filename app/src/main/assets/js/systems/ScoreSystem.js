export class ScoreSystem {
    constructor() {
        this.score = 0;
        this.displayScore = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.multiplier = 1;
        
        this.bestScore = parseInt(localStorage.getItem('trc_best_score') || 0);
    }

    addPoints(basePoints, gameSpeed, targetType) {
        this.combo++;
        if (this.combo > this.maxCombo) this.maxCombo = this.combo;
        
        // Multiplier steps
        this.multiplier = 1 + Math.floor(this.combo / 10);
        
        const typeBonus = targetType === 'gold' ? 3 : (targetType === 'speed' ? 1.5 : 1);
        const points = Math.floor(basePoints * gameSpeed * this.multiplier * typeBonus);
        
        this.score += points;
        return points;
    }

    resetCombo() {
        this.combo = 0;
        this.multiplier = 1;
    }

    update(dt) {
        // Smooth score increment in UI
        if (this.displayScore < this.score) {
            const diff = this.score - this.displayScore;
            this.displayScore += Math.ceil(diff * 0.15);
        }
    }

    checkNewBest() {
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('trc_best_score', this.bestScore);
            return true;
        }
        return false;
    }

    reset() {
        this.score = 0;
        this.displayScore = 0;
        this.combo = 0;
        this.multiplier = 1;
    }
}
