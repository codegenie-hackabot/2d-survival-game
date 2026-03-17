// Score module with dynamic upgrade thresholds – no hard‑coded numbers.
// Upgrade 1 requires 50 points.
// Each subsequent upgrade requires the previous requirement + 50 + (upgradeIndex‑1).
// The reward for an upgrade is added to the score, but the next threshold is calculated
// based only on the previous threshold, ensuring the requirement grows by at least 50
// regardless of the reward added.

export default class Score {
  constructor(initial = 0) {
    this.value = initial;          // current score (includes rewards)
    this.upgradeCount = 0;         // number of upgrades performed
    this.baseRequirement = 50;     // requirement for the first upgrade
    this.nextThreshold = this.baseRequirement; // score needed for next upgrade (excluding future rewards)
  }

  // Add points and automatically handle a single upgrade per call when the threshold is met.
  add(points) {
    const inc = Number(points);
    if (!isNaN(inc)) {
      this.value += inc;
      this._maybeUpgrade();
    }
    return this.value;
  }

  // Check if the current score meets the threshold and apply exactly one upgrade.
  _maybeUpgrade() {
    if (this.value >= this.nextThreshold) {
      this.upgradeCount += 1;
      // Reward for the upgrade (first upgrade gives 50, later upgrades use diminishing returns)
      const reward = this.upgradeCount === 1 ? 50 : Math.round(20 * Math.pow(0.8, this.upgradeCount - 2));
      this.value += reward;
      // Compute the next threshold based solely on the previous threshold.
      this.nextThreshold = this.nextThreshold + 50 + (this.upgradeCount - 1);
    }
  }

  // Expose the current threshold (useful for UI display)
  getThreshold() {
    return this.nextThreshold;
  }

  // Retrieve current score value
  get() {
    return this.value;
  }
}
