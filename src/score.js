// Score module – upgrades only raise the required score by 500 each time.
// Upgrade 1 requires 50 points.
// Upgrade N (N>1) requires 50 + 500*(N-1) points.
// No points are added to the score when an upgrade occurs.

export default class Score {
  constructor(initial = 0) {
    this.value = initial; // current score
    this.upgradeCount = 0; // how many upgrades have been applied
    this.baseRequirement = 50; // requirement for the first upgrade
    this.increment = 500; // increase in requirement after each upgrade
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
    // Compute the requirement for the next upgrade using the formula
    const required = this.baseRequirement + this.upgradeCount * this.increment;
    if (this.value >= required) {
      this.upgradeCount += 1;
      // No reward is added – only the threshold changes.
    }
  }

  // Return the score value.
  get() {
    return this.value;
  }

  // Return the current upgrade requirement.
  getThreshold() {
    return this.baseRequirement + this.upgradeCount * this.increment;
  }
}
