import React, { useEffect, useState } from "react";
import "../../styles/Quiz.css";
import "../../styles/ButtonQuiz.css";
import "../../styles/OptionQuiz.css";
import { FaArrowRight } from "react-icons/fa";
import { BiShow } from "react-icons/bi";

import { useUIHelpers } from "../../hooks/useUIHelpers";
import { useTypewriter } from "../../hooks/useTypewriter";
import { useQuestionManager } from "../../hooks/useQuestionManager";

import Button from "../common/Button";
import TeamDisplay from "../quiz_components/TeamDisplay";
import QuestionCard from "../quiz_components/QuestionCard";
import FinishDisplay from "../common/FinishDisplay";
import TeamAnswerBoxes from "../quiz_components/TeamAnswerBoxes";
import useShiftToShow from "../../hooks/useShiftToShow";
import axios from "axios";
import { useParams } from "react-router-dom";

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

const EstimationRound = ({ onFinish }) => {
  const { showToast } = useUIHelpers();

  const { quizId, roundId } = useParams();

  const [quesFetched, setQuesFetched] = useState([]);

  const [teams, setTeams] = useState([]);

  const [quizCompleted, setQuizCompleted] = useState(false);
  const [questionDisplay, setQuestionDisplay] = useState(false);

  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  const [correctAnswerValue, setCorrectAnswerValue] = useState(null);

  const [scoreMessage, setScoreMessage] = useState([]);

  const [roundPoints, setRoundPoints] = useState([]);
  // const [roundTime, setRoundTime] = useState(INITIAL_TIMER);
  const [reduceBool, setReduceBool] = useState(false);

  const [currentRoundNumber, setCurrentRoundNumber] = useState(0);

  //---------------- Fetch the Data from the DB ----------------
  useEffect(() => {
    const fetchQuizData = async () => {
      if (!quizId || !roundId) return;

      try {
        console.log(
          "🔍 Fetching data for quizId:",
          quizId,
          "| roundId:",
          roundId
        );

        //---------------- 1️⃣ Fetch all quizzes ----------------
        const quizRes = await axios.get(
          "http://localhost:4000/api/quiz/get-quiz",
          {
            withCredentials: true,
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        const allQuizzes = quizRes.data.quiz || [];
        const currentQuiz = allQuizzes.find((q) => q._id === quizId);

        if (!currentQuiz) {
          console.warn("⚠️ No quiz found for this quizId:", quizId);
          return;
        }

        console.log("🎯 Current Quiz:", currentQuiz.name);

        //---------------- 2️⃣ Extract and format teams ----------------
        const teamIds = currentQuiz.teams || [];
        if (!teamIds.length) {
          console.warn("⚠️ No teams found in this quiz.");
        }
        const formattedTeams = teamIds.map((team, index) => ({
          id: team._id,
          name: team.name || `Team ${index + 1}`,
        }));
        console.log("🧩 Formatted Teams:", formattedTeams);
        setTeams(formattedTeams);

        //---------------- 3️⃣ Find the current round ----------------
        const round = currentQuiz.rounds.find((r) => r._id === roundId);
        if (!round) {
          console.warn("⚠️ Round not found:", roundId);
          return;
        }

        //---------------- Store the round number dynamically ----------------
        setCurrentRoundNumber(
          currentQuiz.rounds.findIndex((r) => r._id === roundId) + 1
        );

        setRoundPoints(round.points || 10);
        // setRoundTime(round.timeLimitValue || TEAM_TIME_LIMIT);
        if (round?.rules?.enableNegative) setReduceBool(true);

        //---------------- 4️⃣ Fetch all questions ----------------
        const questionRes = await axios.get(
          "http://localhost:4000/api/question/get-questions",
          {
            withCredentials: true,
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        const allQuestions = questionRes.data.data || [];
        console.log("📦 Total questions fetched:", allQuestions.length);

        //---------------- 5️⃣ Filter questions belonging to this round ----------------
        const filteredQuestions = allQuestions.filter((q) =>
          round.questions.includes(q._id)
        );

        console.log("🧾 Filtered questions for this round:", filteredQuestions);

        //---------------- 6️⃣ Format questions properly ----------------
        const formatted = filteredQuestions.map((q) => {
          const optionsArray =
            typeof q.options[0] === "string"
              ? JSON.parse(q.options[0])
              : q.options;

          const mappedOptions = optionsArray.map((opt, idx) => ({
            id: String.fromCharCode(97 + idx),
            text: typeof opt === "string" ? opt : opt.text || "",
            originalId: opt._id || null,
          }));

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
            mediaType: q.mediaType || q.media?.type || "none",
            mediaUrl: q.mediaUrl || q.media?.url || "",
            round: round.name || "General",
          };
        });

        //---------------- 7️⃣ For estimation rounds, only include numeric questions ----------------
        const estimationNumericQuestions = formatted.filter((q) => {
          const correctOption = q.options.find(
            (opt) => opt.id === q.correctOptionId
          );
          return correctOption && !isNaN(parseFloat(correctOption.text));
        });

        console.log(
          "🔢 Estimation Numeric Questions:",
          estimationNumericQuestions
        );

        setQuesFetched(estimationNumericQuestions);
      } catch (error) {
        console.error("❌ Fetch Error (quiz data):", error);
        showToast("Failed to fetch quiz data!");
      }
    };

    fetchQuizData();
  }, [quizId, roundId]);

  //---------------- Team colors assignment ----------------
  const generateTeamColors = (teams) => {
    const teamColors = {};
    teams.forEach((team, index) => {
      const color = COLORS[index % COLORS.length]; // cycle colors if more teams than colors
      teamColors[team.name || `Team${index + 1}`] = color;
    });
    return teamColors;
  };

  const TEAM_COLORS = generateTeamColors(teams);

  const { currentQuestion, nextQuestion, isLastQuestion } =
    useQuestionManager(quesFetched);

  const [teamAnswers, setTeamAnswers] = useState(
    Object.fromEntries(teams.map((team) => [team, ""]))
  );

  const { displayedText } = useTypewriter(currentQuestion?.question || "", 40);

  //---------------- Move to the Next Question ----------------
  const moveToNextQuestion = () => {
    if (isLastQuestion) {
      setQuizCompleted(true);
    } else {
      nextQuestion();
      setTeamAnswers(Object.fromEntries(teams.map((team) => [team, ""])));
      setQuestionDisplay(false);
      setShowCorrectAnswer(false);
      setCorrectAnswerValue(null);
      setScoreMessage([]);
    }
  };

  //---------------- Handle Answer Change ----------------
  const handleAnswerChange = (team, value) =>
    setTeamAnswers((prev) => ({ ...prev, [team]: value }));

  //---------------- Store which teams have submitted for the current question ----------------
  const [submittedTeams, setSubmittedTeams] = useState([]);

  //---------------- Reset answers & submissions when the question changes ----------------
  useEffect(() => {
    setTeamAnswers({});
    setSubmittedTeams([]);
    setShowCorrectAnswer(false);
    setCorrectAnswerValue(null);
  }, [currentQuestion]);

  //---------------- Handle Submit ----------------
  const handleSubmit = async (teamName) => {
    const answerRaw = teamAnswers[teamName]?.trim();

    // 🧩 Validation
    if (!answerRaw) {
      showToast(`${teamName}, please enter your answer first!`);
      return;
    }

    if (submittedTeams.includes(teamName)) {
      showToast(`⚠️ ${teamName} has already submitted!`);
      return;
    }

    // ✅ Mark this team as submitted
    setSubmittedTeams((prev) => [...prev, teamName]);
    showToast(`(*°▽°*) ${teamName} submitted their answer!`);

    // 🧠 Check if all teams have submitted
    const allTeamsSubmitted = teams.every((t) =>
      [...submittedTeams, teamName].includes(t.name)
    );
    if (!allTeamsSubmitted) return; // wait until all teams submit

    // ===============================
    // 🧮 Evaluate all team answers
    // ===============================
    const correctOption = currentQuestion.options.find(
      (opt) => opt.id === currentQuestion.correctOptionId
    );
    const correctValue = parseFloat(correctOption.text);
    setCorrectAnswerValue(correctValue);
    setShowCorrectAnswer(true);

    // Find smallest difference between team answers and correct value
    let minDiff = Infinity;
    Object.entries(teamAnswers).forEach(([tName, ans]) => {
      const parsed = parseFloat(ans);
      if (!isNaN(parsed)) {
        const diff = Math.abs(parsed - correctValue);
        if (diff < minDiff) minDiff = diff;
      }
    });

    // Find team(s) whose answer(s) are closest
    const closestTeams = Object.entries(teamAnswers)
      .filter(([tName, ans]) => {
        const parsed = parseFloat(ans);
        return !isNaN(parsed) && Math.abs(parsed - correctValue) === minDiff;
      })
      .map(([tName]) => tName);

    console.log("Closest Teams:", closestTeams);

    // ===============================
    // 💾 Submit all team answers to DB
    // ===============================
    for (const t of teams) {
      const teamAnswer = parseFloat(teamAnswers[t.name]);
      if (isNaN(teamAnswer)) continue;

      // Find closest option object
      const closestOption = currentQuestion.options.reduce((prev, opt) => {
        const optVal = parseFloat(opt.text);
        return Math.abs(optVal - teamAnswer) <
          Math.abs(parseFloat(prev.text) - teamAnswer)
          ? opt
          : prev;
      }, currentQuestion.options[0]);

      // ✅ Safely get the correct option's originalId
      const correctOption = currentQuestion.options.find(
        (opt) => opt.id === currentQuestion.correctOptionId
      );

      const finalAnswerId = closestTeams.includes(t.name)
        ? correctOption?.originalId // <-- use originalId for DB
        : closestOption?.originalId || null;

      const payload = {
        quizId,
        roundNumber: currentRoundNumber,
        teamId: t.id,
        questionId: currentQuestion.id,
        answerId: finalAnswerId, // ✅ closest team → correct answerId
        isPassed: false,
      };

      console.log("Submitting payload for", t.name, payload);

      try {
        await axios.post(
          "http://localhost:4000/api/history/submit-ans",
          payload,
          { withCredentials: true }
        );
        console.log(`✅ ${t.name} answer submitted`);
      } catch (err) {
        console.error(
          `❌ Failed to submit ${t.name}:`,
          err.response?.data || err.message
        );
        showToast(`Failed to record answer for ${t.name}!`);
      }
    }

    // ===============================
    // 🏆 Update team scores
    // ===============================
    for (const t of teams) {
      const isClosest = closestTeams.includes(t.name);
      const endpoint = isClosest
        ? `http://localhost:4000/api/team/teams/${t.id}/add`
        : reduceBool
        ? `http://localhost:4000/api/team/teams/${t.id}/reduce`
        : null;

      if (!endpoint) continue;

      try {
        await axios.patch(
          endpoint,
          { points: roundPoints },
          { withCredentials: true }
        );

        const msg = isClosest
          ? `✅ Added +${roundPoints} points for ${t.name}!`
          : `❌ Reduced -5 points for ${t.name}!`;

        setScoreMessage((prev) => [...prev, msg]);
      } catch (err) {
        console.error(`⚠️ Failed to update ${t.name}:`, err);
        showToast(`⚠️ Failed to update score for ${t.name}`);
      }
    }

    // 🎯 Final message
    showToast(
      `🎯 Team${closestTeams.length > 1 ? "s" : ""} ${closestTeams.join(
        ", "
      )} ${closestTeams.length > 1 ? "were" : "was"} closest!`
    );
  };

  //---------------- SHIFT key to show the question ----------------
  useShiftToShow(() => {
    if (!questionDisplay) {
      setQuestionDisplay(true);
    }
  }, [questionDisplay]);

  //---------------- When all question finishes, hide components ----------------
  useEffect(() => {
    const details = document.getElementsByClassName("detail-info");
    Array.from(details).forEach(
      (el) => (el.style.display = quizCompleted ? "none" : "block")
    );
  }, [quizCompleted]);

  //---------------- Renders ----------------
  return (
    <div className="quiz-container">
      {scoreMessage && (
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
        toastMessage="Press 'Submit' to submit your answer"
        estimationEnable={true}
        timeRemaining={0}
      />

      {!quizCompleted ? (
        !questionDisplay ? (
          <div className="centered-control">
            <Button
              className="start-question-btn"
              onClick={() => setQuestionDisplay(true)}
            >
              Show Question
              <BiShow className="icon" />
            </Button>
          </div>
        ) : (
          <>
            {currentQuestion ? (
              <>
                <QuestionCard
                  displayedText={`Q${
                    quesFetched.indexOf(currentQuestion) + 1
                  }. ${displayedText ?? ""}`}
                  mediaType={currentQuestion.mediaType}
                  mediaUrl={currentQuestion.mediaUrl}
                />

                {/* ========================= */}
                {/* SWITCH BETWEEN INPUT OR ANSWER */}
                {/* ========================= */}
                {showCorrectAnswer ? (
                  <>
                    <div className="correct-answer-display">
                      <p>
                        ✅ Correct Answer:{" "}
                        <strong style={{ color: "#c9c9c9ff" }}>
                          {correctAnswerValue}
                        </strong>
                      </p>
                    </div>
                    <Button
                      className="next-question-btn"
                      onClick={moveToNextQuestion}
                    >
                      <h3> NEXT QUESTION</h3>
                      <FaArrowRight />
                    </Button>
                  </>
                ) : (
                  <TeamAnswerBoxes
                    teams={teams}
                    teamColors={TEAM_COLORS}
                    teamAnswers={teamAnswers}
                    handleAnswerChange={handleAnswerChange}
                    handleSubmit={handleSubmit}
                    disabled={false}
                  />
                )}
              </>
            ) : (
              <p className="text-gray-400 mt-4">Loading questions...</p>
            )}
          </>
        )
      ) : (
        <FinishDisplay
          onFinish={onFinish}
          message="Estimation Round Finished!"
        />
      )}

      <div id="toast-container"></div>
    </div>
  );
};

export default EstimationRound;
