// Simple score module: each upgrade requires +50 points.
// Upgrade 1 requires 50 points, upgrade 2 requires 100, upgrade 3 requires 150, etc.
// No points are added to the score when an upgrade occurs.

export default class Score {
  constructor(initial = 0) {
    this.value = initial; // current score
    this.upgradeCount = 0; // number of upgrades applied
    this.baseRequirement = 50; // requirement for first upgrade
    this.increment = 50; // increase per upgrade
  }

  // Add points and automatically handle upgrades when thresholds are met.
  add(points) {
    const inc = Number(points);
    if (!isNaN(inc)) {
      this.value += inc;
      this._maybeUpgrade();
    }
    return this.value;
  }

  // Check and apply upgrades (one at a time) based on the current score.
  _maybeUpgrade() {
    const required = this.baseRequirement + this.upgradeCount * this.increment;
    if (this.value >= required) {
      this.upgradeCount += 1;
      // No reward added; only threshold changes.
    }
  }

  // Return current score.
  get() {
    return this.value;
  }

  // Return current upgrade requirement.
  getThreshold() {
    return this.baseRequirement + this.upgradeCount * this.increment;
  }
}
