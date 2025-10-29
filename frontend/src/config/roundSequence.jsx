import rulesConfig from "./rulesConfig";

// Sort by roundNumber to get the proper sequence
export const getRoundSequence = () => {
  return Object.entries(rulesConfig)
    .sort(([, a], [, b]) => a.roundNumber - b.roundNumber)
    .map(([key]) => key);
};
