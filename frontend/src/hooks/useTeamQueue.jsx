import { useEffect, useState } from "react";
import { useUIHelpers } from "./useUIHelpers";

export function useTeamQueue({
  totalTeams = 4,
  teams = [
    { id: "1", name: "Ala", points: 0 },
    { id: "2", name: "Bravo", points: 0 },
    { id: "3", name: "Charlie", points: 0 },
    { id: "4", name: "Delta", points: 0 },
  ],
  maxQuestionsPerTeam = 2,
  maxQuestionsPerRound = 1,
}) {
  const { showToast } = useUIHelpers();

  // Limit teams
  const limitedTeams = teams.slice(0, totalTeams);

  const [queue, setQueue] = useState(limitedTeams);
  const [activeIndex, setActiveIndex] = useState(0);

  // Counters keyed by team id
  const [teamCounters, setTeamCounters] = useState(
    Object.fromEntries(limitedTeams.map((t) => [t.id, 0]))
  );
  const [roundCounters, setRoundCounters] = useState(
    Object.fromEntries(limitedTeams.map((t) => [t.id, 0]))
  );

  const [secondHand, setSecondHand] = useState(false);
  const [buzzQueue, setBuzzQueue] = useState([]);

  const activeTeam = queue[activeIndex]; // {id, name, points}

  // ---- Sync queue & counters if teams change ----
  useEffect(() => {
    if (!teams || teams.length === 0) return;

    const limited = teams.slice(0, totalTeams);

    setQueue((prevQueue) => {
      const isDifferent =
        prevQueue.length !== limited.length ||
        prevQueue.some((team, idx) => team.id !== limited[idx].id);

      if (isDifferent) {
        setActiveIndex(0);
        setTeamCounters(Object.fromEntries(limited.map((t) => [t.id, 0])));
        setRoundCounters(Object.fromEntries(limited.map((t) => [t.id, 0])));
        return limited;
      }
      return prevQueue;
    });
  }, [teams, totalTeams]);

  // ---- Move to next team ----
  const goToNextTeam = () => {
    setTeamCounters((prev) => {
      const updated = { ...prev };

      if (!secondHand) {
        updated[activeTeam.id] += 1;

        setRoundCounters((roundPrev) => {
          const roundUpdated = { ...roundPrev };
          roundUpdated[activeTeam.id] += 1;

          if (roundUpdated[activeTeam.id] >= maxQuestionsPerRound) {
            if (activeIndex === queue.length - 1) {
              const reversedQueue = [...queue].reverse();
              setQueue(reversedQueue);
              setActiveIndex(0);
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
    const newQueue = [...queue];

    if (next >= queue.length) {
      newQueue.reverse();
      next = 0;
      setRoundCounters(Object.fromEntries(newQueue.map((t) => [t.id, 0])));
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

  // ---- Buzzer queue ----
  const addToBuzzQueue = (teamId) => {
    if (!buzzQueue.includes(teamId)) {
      setBuzzQueue((prev) => [...prev, teamId]);
      return true;
    }
    return false;
  };

  const getNextBuzzTeam = () => {
    if (buzzQueue.length > 0) {
      const [next, ...rest] = buzzQueue;
      setBuzzQueue(rest);
      return queue.find((t) => t.id === next) || null;
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
