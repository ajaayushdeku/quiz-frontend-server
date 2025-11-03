// import React, { useEffect, useState } from "react";
// import "../../styles/Quiz.css";
// import "../../styles/ButtonQuiz.css";
// import "../../styles/OptionQuiz.css";
// import { FaArrowRight } from "react-icons/fa";
// import { BiShow } from "react-icons/bi";

// import { useUIHelpers } from "../../hooks/useUIHelpers";
// import { useTypewriter } from "../../hooks/useTypewriter";
// import { useQuestionManager } from "../../hooks/useQuestionManager";

// import Button from "../common/Button";
// import TeamDisplay from "../quiz/TeamDisplay";
// import QuestionCard from "../quiz/QuestionCard";
// import FinishDisplay from "../common/FinishDisplay";
// import TeamAnswerBoxes from "../quiz/TeamAnswerBoxes";
// import useShiftToShow from "../../hooks/useShiftToShow";

// const TEAM_NAMES = ["Alpha", "Bravo", "Charlie", "Delta"];
// const TEAM_COLORS = {
//   Alpha: "#f5003dff",
//   Bravo: "#0ab9d4ff",
//   Charlie: "#32be76ff",
//   Delta: "#e5d51eff",
// };

// const EstimationQuiz = ({ onFinish }) => {
//   const { showToast } = useUIHelpers();

//   const [quesFetched, setQuesFetched] = useState([]);

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const res = await fetch("http://localhost:4000/api/questions");
//         const resData = await res.json();
//         const quest = resData.data || resData;

//         const formatted = quest.map((q) => ({
//           id: q._id,
//           category: q.category || "General",
//           question: q.text || q.question || "No question provided",
//           options: (q.options || []).map((opt, idx) => ({
//             id: String.fromCharCode(97 + idx),
//             text: typeof opt === "string" ? opt : opt.text || "",
//           })),
//           correctOptionId: String.fromCharCode(
//             97 + (q.options || []).indexOf(q.correctAnswer)
//           ),
//           points: q.points || 10,
//           mediaType: q.mediaType || q.media?.type || "none",
//           mediaUrl: q.mediaUrl || q.media?.url || "",
//           round: q.round?.name || "General",
//         }));

//         const estimationNumericQuestions = formatted.filter((q) => {
//           const correctOption = q.options.find(
//             (opt) => opt.id === q.correctOptionId
//           );
//           return correctOption && !isNaN(parseFloat(correctOption.text));
//         });

//         setQuesFetched(estimationNumericQuestions);
//       } catch (error) {
//         console.error("Fetch Error: ", error);
//       }
//     };
//     fetchData();
//   }, []);

//   const { currentQuestion, nextQuestion, isLastQuestion } =
//     useQuestionManager(quesFetched);

//   const [quizCompleted, setQuizCompleted] = useState(false);
//   const [questionDisplay, setQuestionDisplay] = useState(false);

//   const [teamAnswers, setTeamAnswers] = useState(
//     Object.fromEntries(TEAM_NAMES.map((team) => [team, ""]))
//   );

//   const { displayedText } = useTypewriter(currentQuestion?.question || "", 40);

//   const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
//   const [correctAnswerValue, setCorrectAnswerValue] = useState(null);

//   const moveToNextQuestion = () => {
//     if (isLastQuestion) {
//       setQuizCompleted(true);
//     } else {
//       nextQuestion();
//       setTeamAnswers(Object.fromEntries(TEAM_NAMES.map((team) => [team, ""])));
//       setQuestionDisplay(false);
//       setShowCorrectAnswer(false);
//       setCorrectAnswerValue(null);
//     }
//   };

//   const handleAnswerChange = (team, value) =>
//     setTeamAnswers((prev) => ({ ...prev, [team]: value }));

//   // Handle Submit of team answers
//   const handleSubmit = (team) => {
//     const answer = teamAnswers[team].trim();
//     if (!answer) return;

//     const nextAnswers = { ...teamAnswers, [team]: answer };
//     setTeamAnswers(nextAnswers);

//     const allSubmitted = Object.values(nextAnswers).every(
//       (ans) => ans.trim() !== ""
//     );

//     if (allSubmitted && currentQuestion) {
//       const correctOption = currentQuestion.options.find(
//         (opt) => opt.id === currentQuestion.correctOptionId
//       );
//       const correctValue = parseFloat(correctOption.text);
//       setCorrectAnswerValue(correctValue);
//       setShowCorrectAnswer(true);

//       // Find closest team(s)
//       let minDiff = Infinity;
//       Object.values(nextAnswers).forEach((ans) => {
//         const diff = Math.abs(parseFloat(ans) - correctValue);
//         if (diff < minDiff) minDiff = diff;
//       });

//       const closestTeams = Object.entries(nextAnswers)
//         .filter(
//           ([_, ans]) => Math.abs(parseFloat(ans) - correctValue) === minDiff
//         )
//         .map(([t]) => t);

//       showToast(
//         `╰(*°▽°*)╯ Team${
//           closestTeams.length > 1 ? "s" : ""
//         } ${closestTeams.join(", ")} ${
//           closestTeams.length > 1 ? "were" : "was"
//         } closest!`
//       );
//     } else {
//       showToast(`╰(*°▽°*)╯ Team ${team} submitted their answer`);
//     }
//   };

//   // SHIFT key to show the question
//   useShiftToShow(() => {
//     if (!questionDisplay) {
//       setQuestionDisplay(true);
//     }
//   }, [questionDisplay]);

//   // When all question finishes, hide components
//   useEffect(() => {
//     const details = document.getElementsByClassName("detail-info");
//     Array.from(details).forEach(
//       (el) => (el.style.display = quizCompleted ? "none" : "block")
//     );
//   }, [quizCompleted]);

//   return (
//     <div className="quiz-container">
//       <TeamDisplay
//         teams={TEAM_NAMES}
//         TEAM_COLORS={TEAM_COLORS}
//         toastMessage="Press 'Submit' to submit your answer"
//         estimationEnable={true}
//         timeRemaining={0}
//       />

//       {!quizCompleted ? (
//         !questionDisplay ? (
//           <div className="centered-control">
//             <Button
//               className="start-question-btn"
//               onClick={() => setQuestionDisplay(true)}
//             >
//               Show Question
//               <BiShow className="icon" />
//             </Button>
//           </div>
//         ) : (
//           <>
//             {currentQuestion ? (
//               <>
//                 <QuestionCard
//                   displayedText={`Q${
//                     quesFetched.indexOf(currentQuestion) + 1
//                   }. ${displayedText ?? ""}`}
//                   mediaType={currentQuestion.mediaType}
//                   mediaUrl={currentQuestion.mediaUrl}
//                 />

//                 {/* ========================= */}
//                 {/* SWITCH BETWEEN INPUT OR ANSWER */}
//                 {/* ========================= */}
//                 {showCorrectAnswer ? (
//                   <>
//                     <div className="correct-answer-display">
//                       <p>
//                         ✅ Correct Answer:{" "}
//                         <strong style={{ color: "#32be76ff" }}>
//                           {correctAnswerValue}
//                         </strong>
//                       </p>
//                     </div>
//                     <Button
//                       className="next-question-btn"
//                       onClick={moveToNextQuestion}
//                     >
//                       <h3> NEXT QUESTION</h3>
//                       <FaArrowRight />
//                     </Button>
//                   </>
//                 ) : (
//                   <TeamAnswerBoxes
//                     teamNames={TEAM_NAMES}
//                     teamColors={TEAM_COLORS}
//                     teamAnswers={teamAnswers}
//                     handleAnswerChange={handleAnswerChange}
//                     handleSubmit={handleSubmit}
//                     disabled={false}
//                   />
//                 )}
//               </>
//             ) : (
//               <p className="text-gray-400 mt-4">Loading questions...</p>
//             )}
//           </>
//         )
//       ) : (
//         <FinishDisplay
//           onFinish={onFinish}
//           message="Estimation Round Finished!"
//         />
//       )}

//       <div id="toast-container"></div>
//     </div>
//   );
// };

// export default EstimationQuiz;

import React from "react";

const EstimationQuiz = () => {
  return <div>EstimationQuiz</div>;
};

export default EstimationQuiz;
