import { Game } from './core/Game.js';
import { HUD } from './ui/HUD.js';

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-canvas');
    const fxCanvas = document.getElementById('fx-canvas');
    const hud = new HUD();
    const game = new Game(canvas, fxCanvas);

    // Bridge Game state to HUD
    game.onGameStateChange = (type, data) => {
        if (type === 'gameover') {
            hud.showScreen('gameover', {
                score: game.scoreSystem.score,
                best: game.scoreSystem.bestScore,
                isNewBest: data.isNewBest
            });
        }
    };

    // UI Buttons
    document.getElementById('btn-start').onclick = () => {
        hud.hideAll();
        game.start();
    };

    document.getElementById('btn-restart').onclick = () => {
        hud.hideAll();
        game.start();
    };

    document.getElementById('btn-menu').onclick = () => {
        hud.showScreen('menu');
    };

    // Main UI Loop (for HUD updates)
    function uiLoop() {
        if (game.isPlaying && !game.isPaused) {
            hud.update(game);
        }
        requestAnimationFrame(uiLoop);
    }
    uiLoop();
});
