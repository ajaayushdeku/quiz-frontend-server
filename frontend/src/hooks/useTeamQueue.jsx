import { useState } from "react";
import { useUIHelpers } from "./useUIHelpers";

export function useTeamQueue({
  totalTeams = 4,
  teamNames = ["Alpha", "Bravo", "Charlie", "Delta"], // team names
  maxQuestionsPerTeam = 2,
  maxQuestionsPerRound = 1, // limit per round
}) {
  const { showToast } = useUIHelpers();

  // Initialize queue with team names
  const [queue, setQueue] = useState(teamNames.slice(0, totalTeams));
  const [activeIndex, setActiveIndex] = useState(0);

  // Counters using team names as keys
  const [teamCounters, setTeamCounters] = useState(
    Object.fromEntries(queue.map((name) => [name, 0]))
  );
  const [roundCounters, setRoundCounters] = useState(
    Object.fromEntries(queue.map((name) => [name, 0]))
  );

  const [secondHand, setSecondHand] = useState(false);

  // Buzzer queue
  const [buzzQueue, setBuzzQueue] = useState([]);

  const activeTeam = queue[activeIndex];

  // ---- Go to next team ----
  const goToNextTeam = () => {
    setTeamCounters((prev) => {
      const updated = { ...prev };

      if (!secondHand) {
        updated[activeTeam] += 1;

        setRoundCounters((roundPrev) => {
          const roundUpdated = { ...roundPrev };
          roundUpdated[activeTeam] += 1;

          // Check if team reached max questions per round
          if (roundUpdated[activeTeam] >= maxQuestionsPerRound) {
            // If last team in queue finished first-hand round, reverse queue
            if (activeIndex === queue.length - 1) {
              const reversedQueue = [...queue].reverse();
              setQueue(reversedQueue);
              setActiveIndex(0);
              // showToast(
              //   `All teams finished first-hand questions — order reversed. Next: Team ${reversedQueue[0]}`
              // );
            } else {
              nextIndex();
            }
          }

          return roundUpdated;
        });
      } else {
        setSecondHand(false);
        nextIndex();
      }

      return updated;
    });
  };

  // ---- Increment active index ----
  const nextIndex = () => {
    let next = activeIndex + 1;
    let newQueue = [...queue];

    if (next >= queue.length) {
      // Reverse order after first-hand round
      newQueue.reverse();
      next = 0;
      setRoundCounters(Object.fromEntries(newQueue.map((t) => [t, 0])));
    }

    setQueue(newQueue);
    setActiveIndex(next);
  };

  // ---- Pass question to next team ----
  const passToNextTeam = () => {
    setSecondHand(true);
    const next = (activeIndex + 1) % queue.length;
    const nextTeam = queue[next];
    setActiveIndex(next);
    return nextTeam;
  };

  // ---- Buzzer queue functions ----
  const addToBuzzQueue = (teamName) => {
    if (!buzzQueue.includes(teamName)) {
      setBuzzQueue((prev) => [...prev, teamName]);
      return true;
    }
    return false;
  };

  const getNextBuzzTeam = () => {
    if (buzzQueue.length > 0) {
      const [next, ...rest] = buzzQueue;
      setBuzzQueue(rest);
      return next;
    }
    return null;
  };

  const clearBuzzQueue = () => {
    setBuzzQueue([]);
  };

  return {
    queue,
    activeTeam,
    activeIndex,
    secondHand,
    goToNextTeam,
    passToNextTeam,
    setSecondHand,
    setActiveIndex,
    setQueue,
    teamCounters,
    roundCounters,
    buzzQueue,
    addToBuzzQueue,
    getNextBuzzTeam,
    clearBuzzQueue,
  };
}
