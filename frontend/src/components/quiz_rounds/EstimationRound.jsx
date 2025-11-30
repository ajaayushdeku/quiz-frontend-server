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
    if (!currentQuestion) return;

    for (const t of teams) {
      const ans = teamAnswers[t.name];
      if (!ans || isNaN(Number(ans))) {
        alert(`Team ${t.name} must enter a valid number!`);
        return;
      }
    }

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

    try {
      const response = await axios.post(
        "http://localhost:4000/api/history/submit-ans",
        payload,
        { withCredentials: true }
      );

      const { correctAnswer, winner, message } = response.data;
      setResult({ correctAnswer, winner, message });

      // Find winner team name
      const winnerTeamName =
        teams.find((t) => t.id === winner.teamId)?.name || "Unknown";
      const pointsEarned = winner.pointsAwarded || 0;

      setTeams((prevTeams) =>
        prevTeams.map((t) =>
          t.id === winner.teamId ? { ...t, points: t.points + pointsEarned } : t
        )
      );

      console.log("Winner id:", winner.id);

      // Show toast notification
      showToast(`🎯 Team ${winnerTeamName} is the Closest!`);

      // Set score message
      const scoreMsg = `🏆 ${winnerTeamName} wins! +${pointsEarned} points`;
      setScoreMessage(scoreMsg);
      setSubmitted(true);
    } catch (err) {
      console.error("❌ Submit error:", err.response?.data || err.message);
      alert("Failed to submit answers! Check console for details.");
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
            {" "}
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

                {result?.winner ? (
                  <div className="winner-list">
                    <h4 className="winner-team">🏆 Closest Team(s) : </h4>
                    {([result.winner] || []).map((w) => {
                      const teamName =
                        teams.find((t) => t.id === w.teamId)?.name || "Unknown";
                      return (
                        <div className="winner-team-list">
                          <div>
                            <strong className="winner-team">
                              <MdGroup
                                className="team-icon-result-page"
                                style={{ color: "black" }}
                              />
                              <h3>{teamName.toUpperCase()}</h3>
                            </strong>
                            <p key={w.teamId} className="winner-item">
                              <div className="estimation-winner-team-info">
                                <div>
                                  Team's Answer: <h3> {w.givenAnswer}</h3>
                                </div>
                                {/* Difference from the Estimation:{" "} */}
                                {/* <h3>{w.difference}</h3> */}
                                <div
                                  style={{
                                    paddingLeft: "2rem",
                                    borderLeft: "2px solid #c9c9c9ff",
                                  }}
                                >
                                  {" "}
                                  Points Earned: <h3> {w.pointsAwarded}</h3>
                                </div>
                              </div>
                            </p>
                          </div>
                        </div>
                      );
                    })}
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
                // disabled={!teamAnswers.length === teams.length}
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
          // historyIds={historyIds} // { teamId: historyId, ... }
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
