/**
 * Handles the dynamic difficulty system.
 * Increases game speed and complexity over time.
 */
export class SpeedManager {
    constructor() {
        this.baseSpeed = 1.0;
        this.maxSpeed = 6.0;
        this.rampRate = 0.045; // Speed increase per second
        this.time = 0;
        this.currentSpeed = 1.0;
    }

    reset() {
        this.time = 0;
        this.currentSpeed = this.baseSpeed;
    }

    update(dt) {
        this.time += dt;
        // Linear progression with a cap
        this.currentSpeed = Math.min(this.baseSpeed + this.time * this.rampRate, this.maxSpeed);
    }

    getSpeed() {
        return this.currentSpeed;
    }

    /**
     * Calculates how long a target should stay on screen.
     * @returns {number} lifespan in seconds
     */
    getTargetLifespan() {
        // Starts at 2.0s, scales down to 0.5s at max speed
        return Math.max(0.5, 2.0 - (this.currentSpeed - 1) * 0.3);
    }

    /**
     * Calculates time between spawns.
     * @returns {number} seconds
     */
    getSpawnInterval() {
        // Starts at 1.5s, scales down to 0.4s at max speed
        return Math.max(0.4, 1.5 - (this.currentSpeed - 1) * 0.22);
    }

    /**
     * Progression phase for UI/Audio feedback.
     */
    getPhase() {
        if (this.time < 15) return 1; // Learning
        if (this.time < 35) return 2; // Engagement
        return 3; // Intense
    }
}
