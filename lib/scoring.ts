/**
 * AtomQuest Goal Portal – Centralized Score Computation Utility
 */

export function computeScore(
  uom: string | null,
  target: number | null,
  actual: number | null,
  targetDate?: string | null,
  completionDate?: string | null
): number | null {
  if (actual === null || actual === undefined || isNaN(actual)) {
    // For timeline, if there's no completion date, it's null (unscored)
    if (uom === "timeline" && !completionDate) return null;
    if (uom !== "timeline") return null;
  }

  switch (uom) {
    case "min":
      return Math.min((actual! / (target || 1)) * 100, 100);
      
    case "max":
      return actual === 0 ? 100 : Math.min(((target || 0) / actual!) * 100, 100);
      
    case "zero":
      return actual === 0 ? 100 : 0;
      
    case "timeline":
      if (!targetDate || !completionDate) return null;
      const deadline = new Date(targetDate);
      const completion = new Date(completionDate);
      return completion <= deadline ? 100 : 0;
      
    default:
      return null;
  }
}

export function computeWeightedScore(
  goals: Array<{ weightage: number | null; score: number | null }>
): number {
  return goals.reduce((sum, g) => {
    // Only count if both weightage and score are present
    if (g.score !== null && g.weightage !== null) {
      return sum + (g.score * g.weightage) / 100;
    }
    return sum;
  }, 0);
}
