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
import { useParams } from "react-router-dom";
import useShiftToShow from "../../hooks/useShiftToShow";
import { MdGroup } from "react-icons/md";
import { useUIHelpers } from "../../hooks/useUIHelpers";

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
  const { showToast } = useUIHelpers();

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
          `http://localhost:4000/api/quiz/get-quiz/${quizId}`,
          { withCredentials: true }
        );

        const currentQuiz = quizRes.data.quiz;

        // // Find the current quiz by quizId or roundId
        // const currentQuiz = allQuizzes.find(
        //   (q) => q._id === quizId || q.rounds?.some((r) => r._id === roundId)
        // );
        if (!currentQuiz) return;

        const formattedTeams = currentQuiz.teams.map((t) => ({
          id: t._id,
          name: t.name,
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
    Array.from(details).forEach(
      (el) => (el.style.display = quizCompleted ? "none" : "block")
    );
  }, [quizCompleted]);

  return (
    <section className="quiz-container">
      {scoreMessage && (
        <div className="score-message-list detail-info">
          <div className="score-message">{scoreMessage}</div>
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
          <div className="detail-info result-container">
            {/* <h3 className="result-title">Results:</h3> */}

            {result?.correctAnswer !== undefined && (
              <div className="correct-answer-display">
                <p>
                  🎯 Correct Answer:{" "}
                  <strong style={{ color: "#32be76ff" }}>
                    {result.correctAnswer}
                  </strong>
                </p>
              </div>
            )}

            <div className="centered-control">
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
                            <MdGroup className="team-icon" />
                            <h3>{teamName.toUpperCase()}</h3>
                          </strong>
                          <p key={w.teamId} className="winner-item">
                            <div className="winner-team-info">
                              <div>
                                {" "}
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
        ) : (
          <>
            <QuestionCard
              displayedText={`Q${currentQuestionIndex + 1}. ${
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
        />
      )}
      {/* 
      {currentQuestionIndex >= questions.length && questions.length > 0 && (
        <FinishDisplay
          onFinish={onFinish}
          message="Estimation Round Finished!"
        />
      )} */}

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
