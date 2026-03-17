// Score module for 2D Survival Game
// Provides a Score class that accumulates points with diminishing upgrades.

export default class Score {
  constructor(initial = 0) {
    this.value = initial; // current score
    this.upgradeCount = 0; // how many upgrades performed
  }

  // Add points directly (e.g., from collecting items)
  add(points) {
    const inc = Number(points);
    if (!isNaN(inc)) {
      this.value += inc;
    }
    return this.value;
  }

  // Perform an upgrade that increases the score by a diminishing amount.
  // First upgrade adds 50, second adds 20, then each subsequent adds 20 * 0.8^(n-2).
  upgrade() {
    this.upgradeCount += 1;
    let increment;
    if (this.upgradeCount === 1) {
      increment = 50;
    } else if (this.upgradeCount === 2) {
      increment = 20;
    } else {
      // Diminishing returns: each further upgrade adds 80% of the previous increment.
      const base = 20;
      const factor = Math.pow(0.8, this.upgradeCount - 2);
      increment = Math.round(base * factor);
    }
    this.value += increment;
    return { total: this.value, added: increment };
  }

  // Get the current score value.
  get() {
    return this.value;
  }
}
