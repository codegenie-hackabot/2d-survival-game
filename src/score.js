// Score module with dynamic upgrade thresholds
// The score increases normally via add().
// Upgrades are triggered when the score reaches a threshold.
// The threshold starts at 50 and after each upgrade it increases by at least 50.

export default class Score {
  constructor(initial = 0) {
    this.value = initial;           // current score
    this.upgradeCount = 0;          // how many upgrades performed
    this.nextThreshold = 50;        // score needed for the next upgrade
    this.baseIncrement = 20;        // base increment after the first upgrade
  }

  // Direct addition of points (e.g., from collecting items)
  add(points) {
    const inc = Number(points);
    if (!isNaN(inc)) {
      this.value += inc;
      // After adding, see if we crossed the upgrade threshold
      this._maybeUpgrade();
    }
    return this.value;
  }

  // Internal method that checks the threshold and performs an upgrade if needed
  _maybeUpgrade() {
    while (this.value >= this.nextThreshold) {
      this.upgradeCount += 1;
      let increment;
      if (this.upgradeCount === 1) {
        // First upgrade is a larger jump
        increment = 50;
      } else {
        // Subsequent upgrades use diminishing returns based on baseIncrement
        const factor = Math.pow(0.8, this.upgradeCount - 2);
        increment = Math.round(this.baseIncrement * factor);
      }
      this.value += increment;
      // Ensure the next threshold is at least 50 points higher than the previous one
      this.nextThreshold = Math.max(this.nextThreshold + 50, this.value + 1);
    }
  }

  // Expose the current threshold (useful for UI)
  getThreshold() {
    return this.nextThreshold;
  }

  // Get the current score value.
  get() {
    return this.value;
  }
}
