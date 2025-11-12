import { useEffect, useState } from "react";
import { FaArrowRight } from "react-icons/fa";
import { BiShow } from "react-icons/bi";
import buzzer from "../../assets/images/buzzer.png";

import "../../styles/ButtonQuiz.css";
import "../../styles/Quiz.css";

import { useTypewriter } from "../../hooks/useTypewriter";
import { useTimer } from "../../hooks/useTimer";
import { useQuestionManager } from "../../hooks/useQuestionManager";
import { useUIHelpers } from "../../hooks/useUIHelpers";

import rulesConfig from "../../config/rulesConfig";

import Button from "../common/Button";
import AnswerTextBox from "../common/AnswerTextBox";
import FinishDisplay from "../common/FinishDisplay";

import TeamDisplay from "../quiz_components/TeamDisplay";
import BuzzerButton from "../quiz_components/BuzzerButton";
import QuestionCard from "../quiz_components/QuestionCard";
import useShiftToShow from "../../hooks/useShiftToShow";
import axios from "axios";
import { useParams } from "react-router-dom";

const { settings } = rulesConfig.buzzer_round;
const TIMER = settings.timerPerTeam || 10;

const COLORS = [
  "#8d1734ff",
  "#0ab9d4ff",
  "#32be76ff",
  "#e5d51eff",
  "#ff9800ff",
  "#9c27b0ff",
  "#03a9f4ff",
  "#ffc107ff",
];

const BuzzerRound = ({ onFinish }) => {
  const { showToast } = useUIHelpers();
  const { quizId, roundId } = useParams();

  const [quesFetched, setQuesFetched] = useState([]);
  const [teams, setTeams] = useState([]);
  const [teamAnswer, setTeamAnswer] = useState("");
  const [questionAnswered, setQuestionAnswered] = useState(false);
  const [buzzerPressed, setBuzzerPressed] = useState(null);
  const [teamQueue, setTeamQueue] = useState([]);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [questionDisplay, setQuestionDisplay] = useState(false);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  const [correctAnswerValue, setCorrectAnswerValue] = useState("");
  const [roundPoints, setRoundPoints] = useState(settings.defaultPoints || 10);
  const [roundTime, setRoundTime] = useState(TIMER);
  const [reduceBool, setReduceBool] = useState(false);
  const [scoreMessage, setScoreMessage] = useState([]);
  const [activeTeam, setActiveTeam] = useState(null);
  const [activeRound, setActiveRound] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState(null);

  const normalize = (str) => str?.trim().toLowerCase() || "";

  // -------------------- Fetch Quiz & Questions --------------------
  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        const quizRes = await axios.get(
          "http://localhost:4000/api/quiz/get-quiz",
          { withCredentials: true }
        );
        const allQuizzes = quizRes.data.quizzes || [];
        const currentQuiz = allQuizzes.find((q) => q._id === quizId);
        if (!currentQuiz) return;

        // Safety check for teams
        setTeams(
          (currentQuiz.teams || [])
            .filter((t) => t && t._id)
            .map((t, i) => ({
              id: t._id,
              name: t.name || `Team ${i + 1}`,
              points: t.points || 0,
            }))
        );

        const round = currentQuiz.rounds.find((r) => r._id === roundId);
        if (!round) return;

        setActiveRound(round);
        setRoundPoints(round?.rules?.points || 10);
        setRoundTime(round?.rules?.timeLimitValue || TIMER);
        if (round?.rules?.enableNegative) setReduceBool(true);

        const questionRes = await axios.get(
          "http://localhost:4000/api/question/get-questions",
          { withCredentials: true }
        );
        const allQuestions = questionRes.data.data || [];
        const filteredQuestions = allQuestions.filter((q) =>
          round.questions.includes(q._id)
        );

        const formattedQuestions = filteredQuestions.map((q) => {
          // q.options is now an array of objects { _id, text }
          const mappedOptions = (q.options || []).map((opt, idx) => ({
            id: String.fromCharCode(97 + idx), // 'a', 'b', 'c'...
            text: opt.text || "",
            originalId: opt._id || null,
          }));

          // Find correct option
          const correctIndex = mappedOptions.findIndex(
            (opt) => opt.originalId?.toString() === q.correctAnswer?.toString()
          );

          // If correctOption not in options, maybe shortAnswer
          const correctOptionId =
            correctIndex >= 0
              ? mappedOptions[correctIndex].id
              : mappedOptions[0]?.id || null;

          return {
            id: q._id,
            question: q.text,
            options: mappedOptions,
            correctOptionId,
            mediaType: q.media?.type || "none",
            mediaUrl: q.media?.url || "",
            shortAnswer: q.shortAnswer || null,
          };
        });

        setQuesFetched(formattedQuestions);
      } catch (err) {
        console.error("❌ Fetch Error:", err);
        showToast("Failed to fetch quiz data!");
      }
    };

    if (quizId && roundId) fetchQuizData();
  }, [quizId, roundId]);

  const TEAM_COLORS = Object.fromEntries(
    teams.map((t, i) => [t.name, COLORS[i % COLORS.length]])
  );

  const {
    questions,
    currentQuestion,
    currentQuestionIndex,
    nextQuestion,
    isLastQuestion,
  } = useQuestionManager(quesFetched);

  const { timeRemaining, startTimer, pauseTimer, resetTimer } = useTimer(
    roundTime,
    false
  );

  const { displayedText } = useTypewriter(currentQuestion?.question || "", 50);

  // -------------------- Buzzer Logic --------------------
  const handleBuzzer = (teamName) => {
    if (
      teamQueue.find((t) => t.name === teamName) ||
      activeTeam?.name === teamName
    )
      return;

    const teamObj = teams.find((t) => t.name === teamName);
    if (!teamObj) return;

    // If no active team, make this team the first one to answer
    if (!activeTeam) {
      setActiveTeam(teamObj);
      setBuzzerPressed(teamObj.name);
      resetTimer(roundTime);
      startTimer();
    } else {
      // Only queue up next teams
      setTeamQueue((prev) => [...prev, teamObj]);
    }

    showToast(`Team ${teamObj.name} pressed the buzzer!`);
  };

  const moveToNextTeamOrQuestion = () => {
    if (teamQueue.length === 0) {
      // No more teams, show correct answer
      const correctOption = currentQuestion.options.find(
        (opt) => opt.id === currentQuestion.correctOptionId
      );
      setCorrectAnswerValue(correctOption?.text || "");
      setShowCorrectAnswer(true);
      setActiveTeam(null);
      setBuzzerPressed(null);
      pauseTimer();
      setTeamQueue([]);
      setTeamAnswer("");
      if (isLastQuestion) setQuizCompleted(true);
      return;
    }

    // Move to next team in queue
    const [current, ...rest] = teamQueue;
    setActiveTeam(current);
    setBuzzerPressed(current.name);
    setTeamQueue(rest);
    resetTimer(roundTime);
    startTimer();
    setTeamAnswer("");
    showToast(`Team ${current.name} now answers!`);
  };

  useEffect(() => {
    if (timeRemaining === 0 && buzzerPressed) {
      showToast(`⏰ Time's up! Team ${buzzerPressed} missed their turn.`);
      moveToNextTeamOrQuestion();
    }
  });

  // -------------------- Submit Answer --------------------
  const submitAnswerToBackend = async ({
    teamId,
    questionId,
    givenAnswer = null,
    isPassed = false,
  }) => {
    if (!teamId || !questionId) return null;
    const payload = {
      quizId,
      roundId,
      teamId,
      questionId,
      givenAnswer,
      isPassed,
    };
    try {
      const res = await axios.post(
        "http://localhost:4000/api/history/submit-ans",
        payload,
        { withCredentials: true }
      );
      return res.data;
    } catch (err) {
      console.error("Submission Error:", err);
      showToast("Failed to submit answer!");
      return null;
    }
  };

  // -------------------- Handle Submit --------------------
  const handleSubmit = async () => {
    if (!activeTeam || !currentQuestion || isSubmitting) return;
    setIsSubmitting(true);

    const normalize = (str) => str?.trim().toLowerCase() || "";
    let answerId = -1; // default for wrong answer

    // Check MCQ options
    const matchedOption = currentQuestion.options.find(
      (opt) => normalize(opt.text) === normalize(teamAnswer)
    );
    if (matchedOption) answerId = matchedOption.originalId;

    // Check short answer
    if (currentQuestion.shortAnswer) {
      if (
        normalize(teamAnswer) === normalize(currentQuestion.shortAnswer.text)
      ) {
        answerId = currentQuestion.shortAnswer._id;
      }
    }

    // If input is invalid (doesn’t match any option or short answer)
    // const isInputValid =
    //   matchedOption || (currentQuestion.shortAnswer && answerId !== -1);
    // if (!isInputValid) {
    //   showToast("Invalid answer! Please enter a valid option.");
    //   setIsSubmitting(false);
    //   return;
    // }

    // If wrong answer, send -1 to backend
    const isCorrect =
      answerId === currentQuestion.correctOptionId ||
      (currentQuestion.shortAnswer &&
        answerId === currentQuestion.shortAnswer._id);

    const submitAnswerId = isCorrect ? answerId : -1;

    try {
      const result = await submitAnswerToBackend({
        teamId: activeTeam.id,
        questionId: currentQuestion.id,
        givenAnswer: submitAnswerId,
        isPassed: false,
      });

      if (!result) return;

      const { pointsEarned, teamPoints, correctAnswer } = result;

      const msg = isCorrect
        ? `✅ Correct! +${pointsEarned} points for ${activeTeam.name}`
        : `❌ Wrong! ${pointsEarned < 0 ? pointsEarned : 0} points for ${
            activeTeam.name
          }`;

      setResults({ pointsEarned, teamPoints, correctAnswer });
      setScoreMessage((prev) => [...prev, msg]);
      showToast(msg);

      if (isCorrect) {
        // Correct answer → show and reset
        setCorrectAnswerValue(
          correctAnswer || currentQuestion.shortAnswer?.text || ""
        );
        setShowCorrectAnswer(true);
        setTeamAnswer("");
        setTeamQueue([]);
        setBuzzerPressed(null);
        pauseTimer();
        setQuestionAnswered(true);

        if (isLastQuestion) setQuizCompleted(true);
      } else {
        // Wrong answer → apply negative points if enabled
        if (activeRound?.rules?.enableNegative) {
          const teamIndex = teams.findIndex((t) => t.id === activeTeam.id);
          if (teamIndex >= 0) {
            const updatedTeams = [...teams];
            updatedTeams[teamIndex].points =
              (updatedTeams[teamIndex].points || 0) + pointsEarned;
            setTeams(updatedTeams);
          }
        }
        // Move to next team
        moveToNextTeamOrQuestion();
        setTeamAnswer("");
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to submit answer!");
    } finally {
      setIsSubmitting(false);
    }
    if (isCorrect) {
      setShowCorrectAnswer(true);
      console.log("Show Correct Asnwer:", showCorrectAnswer);
    }
  };

  // -------------------- SHIFT Key --------------------
  useShiftToShow(() => {
    if (!questionDisplay) setQuestionDisplay(true);
  }, [questionDisplay]);

  // Hide components when quiz round completes
  useEffect(() => {
    const details = document.getElementsByClassName("detail-info");
    Array.from(details).forEach((el) => {
      el.style.display = quizCompleted ? "none" : "block";
    });
  }, [quizCompleted]);

  return (
    <div className="quiz-container">
      {scoreMessage.length > 0 && (
        <div className="score-message-list detail-info">
          {scoreMessage.map((msg, i) => (
            <div key={i} className="score-message">
              {msg}
            </div>
          ))}
        </div>
      )}

      <TeamDisplay
        teams={teams}
        TEAM_COLORS={TEAM_COLORS}
        toastMessage="Press 'Buzzer' to Answer the Question"
        timeRemaining={timeRemaining}
        activeTeam={activeTeam}
        headMessage="Answer Question within 10 seconds"
        lowTimer={roundTime / 3}
        midTimer={roundTime / 2}
        highTimer={roundTime}
      />

      {!quizCompleted ? (
        !questionDisplay ? (
          !currentQuestion ? (
            <div className="centered-control">
              <p className="form-heading">Loading questions...</p>
            </div>
          ) : (
            <div className="centered-control">
              <Button
                className="start-question-btn"
                onClick={() => setQuestionDisplay(true)}
              >
                Show Question <BiShow className="icon" />
              </Button>
            </div>
          )
        ) : currentQuestion ? (
          <>
            <QuestionCard
              displayedText={`Q${currentQuestionIndex + 1}. ${displayedText}`}
              category={currentQuestion.category}
              mediaType={currentQuestion.mediaType}
              mediaUrl={currentQuestion.mediaUrl}
            />

            {showCorrectAnswer || results ? (
              <>
                <div className="correct-answer-display">
                  ✅ Correct Answer:{" "}
                  <strong style={{ color: "#32be76ff" }}>
                    {correctAnswerValue}
                  </strong>
                </div>
                <Button
                  className="next-question-btn"
                  onClick={() => {
                    if (!isLastQuestion) {
                      nextQuestion();
                      setQuestionAnswered(false);
                      setQuestionDisplay(false);
                      setShowCorrectAnswer(false);
                      setCorrectAnswerValue("");
                      setTeamAnswer("");
                      resetTimer(roundTime);
                      setScoreMessage([]);
                    } else setQuizCompleted(true);
                  }}
                >
                  <h3>NEXT QUESTION</h3> <FaArrowRight />
                </Button>
              </>
            ) : (
              buzzerPressed &&
              !questionAnswered && (
                <AnswerTextBox
                  value={teamAnswer}
                  onChange={(e) => setTeamAnswer(e.target.value)}
                  onSubmit={handleSubmit}
                  placeholder="Enter your answer"
                  disabled={isSubmitting}
                />
              )
            )}

            <BuzzerButton
              teams={teams}
              teamColors={TEAM_COLORS}
              buzzerIcon={buzzer}
              buzzerPressed={buzzerPressed}
              teamQueue={teamQueue}
              handleBuzzer={handleBuzzer}
              disabled={showCorrectAnswer || isSubmitting}
            />
          </>
        ) : (
          <p className="text-gray-400 mt-4">Loading questions...</p>
        )
      ) : (
        <FinishDisplay onFinish={onFinish} message="Buzzer Round Finished!" />
      )}

      <div id="toast-container"></div>
    </div>
  );
};

export default BuzzerRound;
