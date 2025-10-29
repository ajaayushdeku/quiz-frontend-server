import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getRoundSequence } from "../config/roundSequence";
import rulesConfig from "../config/rulesConfig";

const QuizWrapper = ({ quizKey, children }) => {
  const navigate = useNavigate();
  const roundSequence = getRoundSequence();

  // Common state for all rounds
  const [teamScores, setTeamScores] = useState({
    Alpha: 0,
    Bravo: 0,
    Charlie: 0,
    Delta: 0,
  });

  const [teamData, setTeamData] = useState({
    activeTeam: "Alpha",
    teamQueue: ["Alpha", "Bravo", "Charlie", "Delta"],
  });

  // Called when a round finishes
  const handleRoundComplete = () => {
    const currentIndex = roundSequence.indexOf(quizKey);
    const nextRound = roundSequence[currentIndex + 1];

    if (nextRound) {
      navigate(`/round/${nextRound}`);
    } else {
      navigate("/result"); // Last round finished
    }
  };

  // Function to update team score
  const updateTeamScore = (team, points) => {
    setTeamScores((prev) => ({
      ...prev,
      [team]: (prev[team] || 0) + points,
    }));
  };

  return React.cloneElement(children, {
    onFinish: handleRoundComplete,
    teamScores,
    updateTeamScore,
    teamData,
    setTeamData,
    roundSettings: rulesConfig[quizKey]?.settings || {},
  });
};

export default QuizWrapper;
