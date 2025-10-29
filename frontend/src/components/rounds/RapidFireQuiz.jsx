import axios from "axios";
import { FaArrowRight } from "react-icons/fa6";
import { useRef, useState, useEffect } from "react";

import "../../styles/Quiz.css";
import "../../styles/ButtonQuiz.css";

import { useTimer } from "../../hooks/useTimer";
import { useAnswerHandler } from "../../hooks/useAnswerHandler";
import { useUIHelpers } from "../../hooks/useUIHelpers";
import { useQuestionManager } from "../../hooks/useQuestionManager";
import { useTypewriter } from "../../hooks/useTypewriter";
import { useTeamQueue } from "../../hooks/useTeamQueue"; // ⚡ Added
import useSpaceKeyPass from "../../hooks/useSpaceKeyPass";
import useShiftToShow from "../../hooks/useShiftToShow";

import rulesConfig from "../../config/rulesConfig";
import { formatTime } from "../../utils/formatTime";

import Button from "../common/Button";
import FinishDisplay from "../common/FinishDisplay";
import AnswerTextBox from "../common/AnswerTextBox";

import TeamDisplay from "../quiz_components/TeamDisplay";
import QuestionCard from "../quiz_components/QuestionCard";

const { settings } = rulesConfig.rapid_fire_round;
const INITIAL_TIMER = settings.roundTime;

const TEAM_NAMES = ["Alpha", "Bravo", "Charlie", "Delta"];
const TOTAL_TEAMS = TEAM_NAMES.length;
const TEAM_COLORS = {
  Alpha: "#f5003dff",
  Bravo: "#0ab9d4ff",
  Charlie: "#32be76ff",
  Delta: "#e5d51eff",
};

const RapidFireQuiz = ({ onFinish }) => {
  const [quesFetched, setQuesFetched] = useState([]);
  const [teamQuestions, setTeamQuestions] = useState({});
  const [roundStarted, setRoundStarted] = useState(false);
  const [passCount, setPassCount] = useState(0);
  const [finishQus, setFinishQus] = useState(false);
  const [finalFinished, setFinalFinished] = useState(false);
  const [answerInput, setAnswerInput] = useState("");
  const [answeredQuestions, setAnsweredQuestions] = useState([]);
  const [allTeamsAnswers, setAllTeamsAnswers] = useState([]); // Store all teams' answers

  const { showToast } = useUIHelpers();
  // const qnContainerRef = useRef(null);

  // Fetch questions from MongoDB
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(
          "http://localhost:4000/api/question/get-questions",
          { withCredentials: true }
        );
        console.log("Response status: ", res.status);

        const data = res.data.data || [];
        console.log("Data Received: ", data);

        // Map DB data to quiz format
        const formatted = data.map((q) => {
          const optionsArray =
            typeof q.options[0] === "string"
              ? JSON.parse(q.options[0])
              : q.options;

          // Map options
          const mappedOptions = optionsArray.map((opt, idx) => ({
            id: String.fromCharCode(97 + idx), // 'a', 'b', 'c'…
            text: typeof opt === "string" ? opt : opt.text || "",
            originalId: opt._id || null,
          }));

          // Find correct option index
          const correctIndex = mappedOptions.findIndex(
            (opt) => opt.originalId?.toString() === q.correctAnswer?.toString()
          );

          return {
            id: q._id,
            category: q.category || "General",
            question: q.text || "No question provided",
            options: mappedOptions,
            correctOptionId:
              correctIndex >= 0
                ? mappedOptions[correctIndex].id
                : mappedOptions[0].id,
            points: q.points || 10,
            mediaType: q.mediaType || q.media?.type || "none",
            mediaUrl: q.mediaUrl || q.media?.url || "",
            round: q.round?.name || "General",
          };
        });

        console.log("Formatted questions: ", formatted);
        setQuesFetched(formatted);
      } catch (error) {
        console.error("Fetch Error: ", error);
        showToast("Failed to fetch questions!");
      }
    };
    fetchData();
  }, []);

  // Divide questions among teams
  useEffect(() => {
    if (quesFetched.length === 0) return;

    const maxQuestionsPerTeam = Math.floor(quesFetched.length / TOTAL_TEAMS);
    const teamQuestionSets = {};
    TEAM_NAMES.forEach((team, idx) => {
      const start = idx * maxQuestionsPerTeam;
      const end = start + maxQuestionsPerTeam;
      teamQuestionSets[team] = quesFetched.slice(start, end);
    });
    setTeamQuestions(teamQuestionSets);
  }, [quesFetched]);

  // Hooks
  // Team Queue
  const { activeTeam, goToNextTeam, activeIndex, queue } = useTeamQueue({
    totalTeams: TOTAL_TEAMS,
    teamNames: TEAM_NAMES,
    maxQuestionsPerTeam: Math.floor(quesFetched.length / TOTAL_TEAMS),
  });

  const currentTeamQuestions = teamQuestions[activeTeam] || [];
  const { currentQuestion, nextQuestion, resetQuestion, isLastQuestion } =
    useQuestionManager(currentTeamQuestions);

  useEffect(() => {
    console.log("Current Question: ", currentQuestion);
  }, [currentQuestion]); // only logs when currentQuestion changes

  const { selectedAnswer, selectAnswer, resetAnswer } = useAnswerHandler(
    currentQuestion?.correctOptionId
  );

  const { timeRemaining, startTimer, pauseTimer, resetTimer } = useTimer(
    INITIAL_TIMER,
    true
  );

  const { displayedText } = useTypewriter(currentQuestion?.question || "", 10);

  // ---- Scroll to latest question
  // useEffect(() => {
  //   if (qnContainerRef.current) {
  //     const container = qnContainerRef.current;
  //     container.scrollTop = container.scrollHeight;
  //   }
  // }, [passCount]);

  useEffect(() => {
    if (quesFetched.length === 0) return;

    const questionsPerTeam = Math.floor(quesFetched.length / TOTAL_TEAMS);

    const teamQuestionSets = {};
    TEAM_NAMES.forEach((team, idx) => {
      teamQuestionSets[team] = quesFetched.slice(
        idx * questionsPerTeam,
        (idx + 1) * questionsPerTeam
      );
    });

    setTeamQuestions(teamQuestionSets); // New state to store questions per team
  }, [quesFetched]);

  // ---- Handle answer submit
  const handleInputChange = (e) => setAnswerInput(e.target.value);

  const normalize = (str) =>
    str
      .replace(/[^\w\s]/gi, "")
      .trim()
      .toLowerCase();

  const handleAnswer = (submitted = false) => {
    if (!currentQuestion) return;

    const correctAnswerText =
      currentQuestion.options?.find(
        (opt) => opt.id === currentQuestion.correctOptionId
      )?.text || "";

    let isCorrect = false;

    if (submitted) {
      isCorrect = normalize(answerInput) === normalize(correctAnswerText);
      showToast(isCorrect ? "✅ Correct!" : "❌ Wrong Answer!");
    }

    // Check for duplicates
    const exists = answeredQuestions.some((q) => q.id === currentQuestion.id);
    if (!exists) {
      setAnsweredQuestions((prev) => [
        ...prev,
        {
          id: currentQuestion.id,
          question: currentQuestion.question,
          correctAnswer: correctAnswerText,
          isCorrect,
        },
      ]);
    }

    // Move to next question
    if (isLastQuestion) {
      setFinishQus(true);
      pauseTimer();
    } else {
      nextQuestion();
      setPassCount((prev) => prev + 1);
      setAnswerInput("");
    }

    if (submitted) resetAnswer();
  };

  // Auto-handle when timer runs out
  useEffect(() => {
    if (timeRemaining === 0 && !finishQus && !finalFinished && roundStarted) {
      setFinishQus(true);
      pauseTimer();
    }
  }, [timeRemaining, finishQus, finalFinished, roundStarted]);

  // ✅ Handle next team
  const handleNextTeam = () => {
    const nextTeamIndex = activeIndex + 1;

    // Save this team’s answers
    setAllTeamsAnswers((prev) => [
      ...prev,
      { team: activeTeam, answers: answeredQuestions },
    ]);

    if (nextTeamIndex < queue.length) {
      showToast(
        `🎯 Team ${activeTeam} finished! Next: Team ${queue[nextTeamIndex]}`
      );
    } else {
      showToast("🏁 All teams finished the quiz!");
      setFinalFinished(true);
      return;
    }

    goToNextTeam();
    resetTimer();
    resetQuestion();
    setFinishQus(false);
    setPassCount(0);
    setRoundStarted(false);
    setAnswerInput("");
    setAnsweredQuestions([]);
  };

  // SPACE to pass
  useSpaceKeyPass(() => {
    handleAnswer(false);
  }, [currentQuestion]);

  // SHIFT key to show question
  useShiftToShow(() => {
    if (!roundStarted) {
      startRound();
    }
  }, [roundStarted, activeTeam]);

  // Start round button
  const startRound = () => {
    setRoundStarted(true);
    startTimer();
    showToast(`🏁 Team ${activeTeam} started their round!`);
  };

  // Start Round
  useEffect(() => {
    if (!roundStarted) {
      pauseTimer();
    }
  }, [roundStarted]);

  // Hide detail info when final finished
  useEffect(() => {
    const details = document.getElementsByClassName("detail-info");
    Array.from(details).forEach(
      (el) => (el.style.display = finalFinished ? "none" : "block")
    );
  }, [finalFinished]);

  return (
    <section className="quiz-container">
      {/* Team Display */}
      <TeamDisplay
        activeTeam={activeTeam}
        timeRemaining={timeRemaining}
        TEAM_COLORS={TEAM_COLORS}
        formatTime={formatTime}
        toastMessage="Press 'Space' to Pass  to the Next Question"
        headMessage="Answer All the Question under the time limit ( 2 mins )!"
        lowTimer={30}
        midTimer={60}
        highTimer={120}
      />

      {!roundStarted && !finalFinished ? (
        <>
          {" "}
          <div className="centered-control">
            <Button className="start-question-btn" onClick={startRound}>
              Start Round 🏁
            </Button>
          </div>
        </>
      ) : !finishQus && !finalFinished ? (
        currentQuestion ? (
          <>
            {/* <section className="quiz-questions">
            <div className="questions-container" ref={qnContainerRef}>
              {quizData.slice(0, passCount + 1).map((ques, index) => (
                <div key={ques.id} className="qn">
                  Q{index + 1}.{" "}
                  {index === passCount ? displayedText : ques.question}
                </div>
              ))}
            </div>
          </section> */}

            {/* Question Section */}
            <QuestionCard
              questionText={currentQuestion?.question}
              displayedText={`Q${passCount + 1}. ${displayedText}`}
              mediaType={currentQuestion?.mediaType}
              mediaUrl={currentQuestion?.mediaUrl}
            />

            {/* Answer Input */}
            <AnswerTextBox
              value={answerInput}
              onChange={handleInputChange}
              onSubmit={() => handleAnswer(true)}
              placeholder="Enter your answer"
            />
          </>
        ) : (
          <p className="text-gray-400 mt-4">Loading questions...</p>
        )
      ) : finalFinished ? (
        <>
          <FinishDisplay
            onFinish={onFinish}
            message="Rapid Fire Round Finished!"
          />
        </>
      ) : (
        <div className="finished-msg">
          <h1>Team {activeTeam} Finished!</h1>
          <Button className="next-team-btn" onClick={handleNextTeam}>
            NEXT TEAM's TURN
          </Button>

          {answeredQuestions.length > 0 && (
            <div className="team-answer-summary">
              <h3
                className="team-answer-title"
                style={{ color: TEAM_COLORS[activeTeam], fontWeight: "bold" }}
              >
                Team {activeTeam}'s Answer Summary:
              </h3>
              <div className="team-answer-grid">
                {answeredQuestions.map((q, index) => (
                  <div key={q.id} className="team-answer-card">
                    <h4 className="team-answer-question">
                      Q{index + 1}: {q.question}
                    </h4>
                    <p
                      className={`team-answer-status ${
                        q.isCorrect ? "correct" : "wrong"
                      }`}
                    >
                      Your Answer is {q.isCorrect ? "✅ Correct" : "❌ Wrong"}
                    </p>
                    <p className="team-summary-answer">
                      <span> ✅ Correct Answer:</span> <br />
                      {q.correctAnswer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div id="toast-container"></div>
    </section>
  );
};

export default RapidFireQuiz;
