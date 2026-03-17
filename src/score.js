// Score module with dynamic upgrade thresholds (no hard‑coded values)
// Upgrade 1 requires 50 points.
// Each subsequent upgrade requires the previous requirement plus 50 plus the upgrade index minus 1.
// This ensures the minimum required score grows by at least 50 each time and adds a slowly increasing offset.

export default class Score {
  constructor(initial = 0) {
    this.value = initial;          // current score
    this.upgradeCount = 0;         // number of upgrades performed
    this.baseRequirement = 50;     // requirement for the first upgrade
    this.nextThreshold = this.baseRequirement; // score needed for next upgrade
  }

  // Add points and automatically handle upgrades when thresholds are met
  add(points) {
    const inc = Number(points);
    if (!isNaN(inc)) {
      this.value += inc;
      this._maybeUpgrade();
    }
    return this.value;
  }

  // Check and apply upgrades as long as the score meets the current threshold
  _maybeUpgrade() {
    while (this.value >= this.nextThreshold) {
      this.upgradeCount += 1;
      // Reward for the upgrade (first upgrade gives 50, later upgrades give diminishing returns)
      const reward = this.upgradeCount === 1 ? 50 : Math.round(20 * Math.pow(0.8, this.upgradeCount - 2));
      this.value += reward;
      // Next threshold = previous threshold + 50 + (upgradeCount - 1)
      this.nextThreshold = this.nextThreshold + 50 + (this.upgradeCount - 1);
    }
  }

  // Get the current threshold (useful for UI display)
  getThreshold() {
    return this.nextThreshold;
  }

  // Retrieve current score value
  get() {
    return this.value;
  }
}
