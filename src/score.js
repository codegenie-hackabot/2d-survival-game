// Score module with configurable upgrade thresholds (no hard‑coded values)
// The score grows via add().
// Each upgrade requires an additional 50 points plus the upgrade index (n).
// Upgrade 1 adds 50 points, upgrade 2 requires 50+2 extra, etc.

export default class Score {
  constructor(initial = 0) {
    this.value = initial;          // current score
    this.upgradeCount = 0;         // number of upgrades performed
    this.baseRequirement = 50;     // base points needed for the first upgrade
    this.nextThreshold = this.baseRequirement; // score needed for next upgrade
  }

  // Add points (e.g., from collecting items) and automatically handle upgrades
  add(points) {
    const inc = Number(points);
    if (!isNaN(inc)) {
      this.value += inc;
      this._maybeUpgrade();
    }
    return this.value;
  }

  // Internal check for crossing the upgrade threshold
  _maybeUpgrade() {
    while (this.value >= this.nextThreshold) {
      this.upgradeCount += 1;
      // Apply upgrade reward (first upgrade gives 50, later upgrades give diminishing returns)
      const reward = this.upgradeCount === 1 ? 50 : Math.round(20 * Math.pow(0.8, this.upgradeCount - 2));
      this.value += reward;
      // Calculate the next threshold: previous threshold + 50 + current upgrade index (n)
      this.nextThreshold = this.nextThreshold + 50 + this.upgradeCount;
    }
  }

  // Expose the current upgrade threshold (useful for UI)
  getThreshold() {
    return this.nextThreshold;
  }

  // Retrieve current score value
  get() {
    return this.value;
  }
}
