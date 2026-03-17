// Score module for 2D Survival Game
// Provides a simple Score class that accumulates points.

export default class Score {
  constructor(initial = 0) {
    this.value = initial;
  }

  // Add points to the current score. Returns the new total.
  add(points) {
    // Ensure points is a number; if not, ignore.
    const inc = Number(points);
    if (!isNaN(inc)) {
      this.value += inc;
    }
    return this.value;
  }

  // Get the current score value.
  get() {
    return this.value;
  }
}
