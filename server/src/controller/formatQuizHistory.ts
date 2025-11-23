interface IAnswer {
  isCorrect: boolean;
  isPassed: boolean;
  pointsEarned: number;
}

interface IQuizHistory {
  teamId: string | { name?: string };
  roundId: string | { name?: string; roundNumber?: number };
  answers: IAnswer[];
}

interface RoundStats {
  roundId: string;
  roundNumber: number;
  roundName: string;
  attempted: number;
  correct: number;
  wrong: number;
  passed: number;
  pointsEarned: number;
}

interface TeamStats {
  teamId: string;
  teamName: string;
  roundWiseStats: RoundStats[];
}

export const formatQuizHistory = (histories: IQuizHistory[]): TeamStats[] => {
  const teamMap: Record<string, TeamStats> = {};

  histories.forEach((history) => {
    // Make sure teamId and roundId exist
    if (!history.teamId || !history.roundId) return;

    const teamId = history.teamId.toString();
    const roundId = history.roundId.toString();

    if (!teamMap[teamId]) {
      teamMap[teamId] = {
        teamId,
        teamName:
          typeof history.teamId !== "string" && history.teamId["name"]
            ? history.teamId["name"]
            : "Unknown",
        roundWiseStats: [],
      };
    }

    const roundStats: RoundStats = {
      roundId,
      roundNumber:
        typeof history.roundId !== "string" && history.roundId["roundNumber"]
          ? history.roundId["roundNumber"]
          : 1,
      roundName:
        typeof history.roundId !== "string" && history.roundId["name"]
          ? history.roundId["name"]
          : "Unknown Round",
      attempted: history.answers.length,
      correct: history.answers.filter((a) => a.isCorrect).length,
      wrong: history.answers.filter((a) => !a.isCorrect).length,
      passed: history.answers.filter((a) => a.isPassed).length,
      pointsEarned: history.answers.reduce((sum, a) => sum + a.pointsEarned, 0),
    };

    teamMap[teamId].roundWiseStats.push(roundStats);
  });

  return Object.values(teamMap);
};
