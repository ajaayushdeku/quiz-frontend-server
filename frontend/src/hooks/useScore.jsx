import { useState } from "react";

export function useScore(totalTeams = 4, initialScore = 0) {
  const [scores, setScores] = useState(
    Array.from({ length: totalTeams }, (_, i) => ({
      team: i + 1,
      score: initialScore,
    }))
  );

  // Add points to a team
  const addScore = (teamId, points) => {
    setScores((prev) =>
      prev.map((t) =>
        t.team === teamId ? { ...t, score: t.score + points } : t
      )
    );
  };

  // Subtract points from a team
  const deductScore = (teamId, points) => {
    setScores((prev) =>
      prev.map((t) =>
        t.team === teamId ? { ...t, score: Math.max(0, t.score - points) } : t
      )
    );
  };

  // Reset all scores
  const resetScores = () => {
    setScores((prev) => prev.map((t) => ({ ...t, score: initialScore })));
  };

  return {
    scores,
    addScore,
    deductScore,
    resetScores,
  };
}
