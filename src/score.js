// Score module with fixed 500-point upgrade requirement only.
// Upgrade 1 requires 50 points.
// Each subsequent upgrade requires the previous requirement + 500.
// Upgrades no longer add points to the score; they only raise the threshold.

export default class Score {
  constructor(initial = 0) {
    this.value = initial;          // current score (no upgrade rewards)
    this.upgradeCount = 0;         // number of upgrades performed
    this.baseRequirement = 50;     // requirement for the first upgrade
    this.nextThreshold = this.baseRequirement; // score needed for next upgrade
    this.requirementIncrement = 500; // increase in requirement after each upgrade
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

  // Apply upgrades as long as the current score meets the threshold.
  _maybeUpgrade() {
    while (this.value >= this.nextThreshold) {
      this.upgradeCount += 1;
      // No reward added to the score for upgrades.
      // Increase the requirement for the next upgrade by 500.
      this.nextThreshold = this.nextThreshold + this.requirementIncrement;
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
