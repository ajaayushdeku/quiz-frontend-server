import React, { useEffect, useState } from "react";
import "../../styles/Quiz.css";
import "../../styles/ButtonQuiz.css";
import "../../styles/OptionQuiz.css";
import { FaArrowRight } from "react-icons/fa";
import { BiShow } from "react-icons/bi";
import Button from "../common/Button";
import TeamDisplay from "../quiz_components/TeamDisplay";
import QuestionCard from "../quiz_components/QuestionCard";
import TeamAnswerBoxes from "../quiz_components/TeamAnswerBoxes";
import FinishDisplay from "../common/FinishDisplay";
import axios from "axios";
import { useLocation, useParams } from "react-router-dom";
import useShiftToShow from "../../hooks/useShiftToShow";
import { MdGroup } from "react-icons/md";
import { useUIHelpers } from "../../hooks/useUIHelpers";
import { TbScoreboard } from "react-icons/tb";

const COLORS = [
  "#d61344ff",
  "#0ab9d4ff",
  "#32be76ff",
  "#e5d51eff",
  "#ff9800ff",
  "#9c27b0ff",
  "#03a9f4ff",
  "#ffc107ff",
];

const EstimationRound = ({ onFinish, sessionId }) => {
  const { quizId, roundId } = useParams();

  const [teams, setTeams] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [questionDisplay, setQuestionDisplay] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [fullscreenMedia, setFullscreenMedia] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showQuestion, setShowQuestion] = useState(false);
  const [teamAnswers, setTeamAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [scoreMessage, setScoreMessage] = useState("");

  const [showScoresModal, setShowScoresModal] = useState(false);

  const { showToast } = useUIHelpers();

  const location = useLocation();
  const { historyIds } = location.state || {}; // { teamId: historyId }

  const TEAM_COLORS = Object.fromEntries(
    teams.map((team, i) => [team.name, COLORS[i % COLORS.length]])
  );

  // 🧩 Fetch Quiz and Questions
  useEffect(() => {
    const fetchData = async () => {
      if (!quizId || !roundId) return;
      try {
        // Fetch single quiz by ID
        const quizRes = await axios.get(
          "http://localhost:4000/api/quiz/get-quizForUser",
          { withCredentials: true }
        );

        const allQuizzes = quizRes.data.quizzes || [];

        console.log("All Quiz:", allQuizzes);

        // Find the current quiz by quizId or roundId
        const currentQuiz = allQuizzes.find(
          (q) => q._id === quizId || q.rounds?.some((r) => r._id === roundId)
        );

        if (!currentQuiz) return;

        const formattedTeams = currentQuiz.teams.map((t) => ({
          id: t._id,
          name: t.name,
          points: t.points || 0,
        }));
        setTeams(formattedTeams);

        const round = currentQuiz.rounds.find((r) => r._id === roundId);
        if (!round) return;

        const questionRes = await axios.get(
          "http://localhost:4000/api/question/get-questions",
          {
            withCredentials: true,
          }
        );
        const allQuestions = questionRes.data.data || [];
        const filteredQuestions = allQuestions.filter((q) =>
          round.questions.includes(q._id)
        );

        const estimationQuestions = filteredQuestions.filter((q) => {
          const ans = q.correctAnswer || q.shortAnswer?.text;
          return !isNaN(parseFloat(ans));
        });

        setQuestions(estimationQuestions);

        const answersInit = {};
        formattedTeams.forEach((t) => (answersInit[t.name] = ""));
        setTeamAnswers(answersInit);
      } catch (err) {
        console.error("❌ Failed to fetch data:", err);
      }
    };
    fetchData();
  }, [quizId, roundId]);

  const currentQuestion = questions[currentQuestionIndex];

  // 🧮 Handle input change
  const handleAnswerChange = (teamName, value) => {
    setTeamAnswers((prev) => ({ ...prev, [teamName]: value }));
  };

  // 📨 Submit all answers
  const handleSubmit = async () => {
    if (!currentQuestion) {
      alert("No question available!");
      return;
    }

    // Validate all teams have entered a valid number
    for (const t of teams) {
      const ans = teamAnswers[t.name];
      if (!ans || ans.trim() === "" || isNaN(Number(ans))) {
        alert(`Team ${t.name} must enter a valid number!`);
        return;
      }
    }

    // Build answers payload
    const answersPayload = teams.map((t) => ({
      teamId: t.id,
      givenAnswer: Number(teamAnswers[t.name]),
    }));

    const payload = {
      quizId,
      roundId,
      questionId: currentQuestion._id,
      answers: answersPayload,
      sessionId,
    };

    console.log("📤 Submitting payload:", payload);

    try {
      const response = await axios.post(
        "http://localhost:4000/api/history/submit-ans",
        payload,
        { withCredentials: true }
      );

      console.log("✅ Submit response:", response.data);

      const { correctAnswer, winners, message } = response.data;

      // Handle multiple winners
      if (winners && Array.isArray(winners) && winners.length > 0) {
        setResult({ correctAnswer, winners, message });

        // Update team points for all winners
        setTeams((prevTeams) =>
          prevTeams.map((team) => {
            const winnerData = winners.find((w) => w.teamId === team.id);
            if (winnerData) {
              return {
                ...team,
                points: team.points + winnerData.pointsAwarded,
              };
            }
            return team;
          })
        );

        // Create toast messages for winners
        if (winners.length === 1) {
          const winnerTeamName =
            teams.find((t) => t.id === winners[0].teamId)?.name || "Unknown";
          showToast(`🎯 Team ${winnerTeamName} is the Closest!`);
          setScoreMessage(
            `🏆 ${winnerTeamName} wins! +${winners[0].pointsAwarded} points`
          );
        } else {
          const winnerNames = winners
            .map((w) => teams.find((t) => t.id === w.teamId)?.name || "Unknown")
            .join(", ");
          showToast(`🎯 Multiple Winners: ${winnerNames}!`);
          setScoreMessage(
            `🏆 Tie! Winners: ${winnerNames} (+${winners[0].pointsAwarded} points each)`
          );
        }

        setSubmitted(true);
      } else {
        console.error("❌ No winners in response");
        alert("Error: No winners data received from server");
      }
    } catch (err) {
      console.error("❌ Submit error:", err.response?.data || err.message);
      alert(
        `Failed to submit answers! ${
          err.response?.data?.message || err.message
        }`
      );
    }
  };

  if (!sessionId)
    console.warn("No sessionId provided! QuizWrapper should pass it.");

  console.log("Results:", result);

  const nextQuestion = () => {
    setCurrentQuestionIndex((prev) => prev + 1);
    setShowQuestion(false);
    setSubmitted(false);
    setTeamAnswers(Object.fromEntries(teams.map((t) => [t.name, ""])));
    setResult(null);
    setScoreMessage("");
  };

  useEffect(() => {
    if (currentQuestionIndex >= questions.length && questions.length > 0) {
      setQuizCompleted(true);
    }
  });

  //---------------- SHIFT key to show the question ----------------
  useShiftToShow(() => {
    if (!showQuestion) {
      setShowQuestion(true);
    }
  }, [showQuestion]);

  //---------------- When all question finishes, hide components ----------------
  const handleMediaClick = (url) => setFullscreenMedia(url);
  const closeFullscreen = () => setFullscreenMedia(null);

  useEffect(() => {
    const details = document.getElementsByClassName("detail-info");
    Array.from(details).forEach((el) => {
      el.style.display = quizCompleted ? "none" : "block";
    });
  }, [quizCompleted]);

  return (
    <section className="quiz-container">
      {scoreMessage && (
        <div className="score-message-list detail-info">
          <div className="score-message">{scoreMessage}</div>
        </div>
      )}

      {/* View Scores Button */}
      <button
        className="view-scores-btn detail-info"
        onClick={() => setShowScoresModal(true)}
      >
        <TbScoreboard className="view-score-icon" />
      </button>

      {showScoresModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowScoresModal(false)}
        >
          <div className="scores-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Current Team Scores</h3>
            <ul>
              {teams.map((team, idx) => (
                <div key={team.id}>
                  <span>
                    <span className="team-color-indicator">
                      <MdGroup style={{ color: TEAM_COLORS[team.name] }} />
                    </span>

                    <span
                      className="team-name-view"
                      style={{ color: TEAM_COLORS[team.name] }}
                    >
                      {team.name.toUpperCase()}:
                    </span>
                  </span>
                  <span className="team-points-view">{team.points} pts</span>
                </div>
              ))}
            </ul>
            <button
              className="close-modal-btn"
              onClick={() => setShowScoresModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {!quizCompleted && (
        <TeamDisplay
          teams={teams}
          TEAM_COLORS={TEAM_COLORS}
          toastMessage="Press 'Submit' to submit your answer"
          estimationEnable={true}
          timeRemaining={0}
        />
      )}

      {!quizCompleted ? (
        !showQuestion ? (
          !currentQuestion ? (
            <div className="centered-control">
              <p className="form-heading">Loading questions...</p>
            </div>
          ) : (
            <div className="centered-control">
              <Button
                className="start-question-btn"
                onClick={() => setShowQuestion(true)}
              >
                Show Question <BiShow className="icon" />
              </Button>
            </div>
          )
        ) : submitted ? (
          <>
            <QuestionCard
              displayedText={`${currentQuestionIndex + 1}. ${
                currentQuestion.text
              }`}
              mediaType={currentQuestion.mediaType}
              mediaUrl={currentQuestion.mediaUrl}
              onMediaClick={handleMediaClick}
            />
            <div className="detail-info">
              {result?.correctAnswer !== undefined && (
                <div className="correct-answer-display">
                  <p>
                    ✓ Here is the Correct Answer:{" "}
                    <strong style={{ color: "#32be76ff" }}>
                      {result.correctAnswer}
                    </strong>
                  </p>
                </div>
              )}

              <div className="estimate-centered-control">
                <Button className="next-question-btn" onClick={nextQuestion}>
                  <h3>NEXT QUESTION</h3>
                  <FaArrowRight />
                </Button>

                {result?.winners && result.winners.length > 0 ? (
                  <div className="winner-list">
                    <h2 className="winner-heading">
                      🏆 Closest Team{result.winners.length > 1 ? "s" : ""} :{" "}
                    </h2>

                    <strong className="winner-team">
                      <MdGroup
                        className="team-icon-result-page"
                        style={{
                          color: "black",
                        }}
                      />
                      <h3>
                        {" "}
                        {result.winners
                          .map((w) =>
                            teams
                              .find((t) => t.id === w.teamId)
                              ?.name.toUpperCase()
                          )
                          .join(", ")}
                      </h3>
                    </strong>

                    <p className="winner-item">
                      <div className="estimation-winner-team-info">
                        <div>
                          Team's Answer:{" "}
                          <h3> {result.winners[0].givenAnswer}</h3>
                        </div>
                        <div
                          style={{
                            padding: "0rem 2rem",
                            borderLeft: "2px solid #c9c9c9ff",
                            borderRight: "2px solid #c9c9c9ff",
                          }}
                        >
                          Difference:{" "}
                          <h3>
                            {Math.abs(
                              result.correctAnswer -
                                result.winners[0].givenAnswer
                            )}
                          </h3>
                        </div>
                        <div>
                          Points Earned:{" "}
                          <h3> {result.winners[0].pointsAwarded}</h3>
                        </div>
                      </div>
                    </p>
                  </div>
                ) : (
                  <p className="waiting-text">Waiting for remaining teams...</p>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            <QuestionCard
              displayedText={`${currentQuestionIndex + 1}. ${
                currentQuestion.text
              }`}
              mediaType={currentQuestion.mediaType}
              mediaUrl={currentQuestion.mediaUrl}
              onMediaClick={handleMediaClick}
            />

            <TeamAnswerBoxes
              teams={teams}
              teamColors={TEAM_COLORS}
              teamAnswers={teamAnswers}
              handleAnswerChange={handleAnswerChange}
              handleSubmit={handleSubmit}
              disabled={submitted}
            />

            <div className="submit-btn-container">
              <Button
                onClick={handleSubmit}
                disabled={submitted}
                children="Submit"
                className="submit-button"
              />
            </div>
          </>
        )
      ) : (
        <FinishDisplay
          onFinish={onFinish}
          message="Estimation Round Finished!"
          teams={teams}
        />
      )}

      {fullscreenMedia && (
        <div className="fullscreen-overlay" onClick={closeFullscreen}>
          {fullscreenMedia.endsWith(".mp4") ? (
            <video src={fullscreenMedia} controls autoPlay />
          ) : (
            <img src={fullscreenMedia} alt="Question Media" />
          )}
        </div>
      )}

      <div id="toast-container"></div>
    </section>
  );
};

export default EstimationRound;
