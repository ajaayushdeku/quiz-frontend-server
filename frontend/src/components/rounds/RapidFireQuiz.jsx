// import { useRef, useState, useEffect } from "react";
// import logo from "../../assets/images/logo.png";
// import "../../styles/Quiz.css";
// import "../../styles/ButtonQuiz.css";
// import { BiShow } from "react-icons/bi";

// import { useTimer } from "../../hooks/useTimer";
// import { useAnswerHandler } from "../../hooks/useAnswerHandler";
// import { useUIHelpers } from "../../hooks/useUIHelpers";
// import { useQuestionManager } from "../../hooks/useQuestionManager";
// import { useTypewriter } from "../../hooks/useTypewriter";
// import { useTeamQueue } from "../../hooks/useTeamQueue"; // ⚡ Added
// import rulesConfig from "../../config/rulesConfig";
// import { formatTime } from "../../utils/formatTime";
// import TeamDisplay from "../quiz/TeamDisplay";
// import FinishDisplay from "../common/FinishDisplay";
// import AnswerTextBox from "../common/AnswerTextBox";
// import QuestionCard from "../quiz/QuestionCard";
// import useSpaceKeyPass from "../../hooks/useSpaceKeyPass";
// import useShiftToShow from "../../hooks/useShiftToShow";

// const { settings } = rulesConfig.rapidfirequiz;
// const INITIAL_TIMER = settings.roundTime;

// const TEAM_NAMES = ["Alpha", "Bravo", "Charlie", "Delta"];
// const TOTAL_TEAMS = 4;
// const TEAM_COLORS = {
//   Alpha: "#f5003dff",
//   Bravo: "#0ab9d4ff",
//   Charlie: "#32be76ff",
//   Delta: "#e5d51eff",
// };

// const RapidFireQuiz = ({ onFinish }) => {
//   const { showToast } = useUIHelpers();
//   // const qnContainerRef = useRef(null);

//   const [quesFetched, setQuesFetched] = useState([]);

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const res = await fetch("http://localhost:4000/api/questions");
//         const resData = await res.json();
//         const quest = resData.data || resData;

//         const formatted = quest.map((q) => {
//           const options = (q.options || []).map((opt, idx) => ({
//             id: String.fromCharCode(97 + idx),
//             text: typeof opt === "string" ? opt : opt.text || "",
//           }));
//           const correctIndex = options.findIndex(
//             (opt) => opt.text === q.correctAnswer
//           );
//           return {
//             id: q._id,
//             category: q.category || "General",
//             question: q.text || "No question provided",
//             options,
//             correctOptionId:
//               correctIndex >= 0 ? String.fromCharCode(97 + correctIndex) : "a",
//             points: q.points || 10,
//             mediaType: q.media?.type || null,
//             mediaUrl: q.media?.url || "",
//             round: q.round?.name || "General",
//           };
//         });

//         setQuesFetched(formatted);
//       } catch (error) {
//         console.error("Fetch Error: ", error);
//       }
//     };
//     fetchData();
//   }, []);

//   // Hooks
//   const { currentQuestion, nextQuestion, resetQuestion, isLastQuestion } =
//     useQuestionManager(quesFetched);

//   useEffect(() => {
//     console.log("Current Question: ", currentQuestion);
//   }, [currentQuestion]); // only logs when currentQuestion changes

//   const { activeTeam, goToNextTeam, activeIndex, queue } = useTeamQueue({
//     totalTeams: TOTAL_TEAMS,
//     teamNames: TEAM_NAMES,
//     maxQuestionsPerTeam: 2,
//   });

//   const { selectedAnswer, selectAnswer, resetAnswer } = useAnswerHandler(
//     currentQuestion?.correctOptionId
//   );

//   const { timeRemaining, startTimer, pauseTimer, resetTimer } = useTimer(
//     INITIAL_TIMER,
//     true
//   );

//   const { displayedText } = useTypewriter(currentQuestion?.question || "", 10);

//   const [roundStarted, setRoundStarted] = useState(false);
//   const [passCount, setPassCount] = useState(0);
//   const [finishQus, setFinishQus] = useState(false);
//   const [finalFinished, setFinalFinished] = useState(false);
//   const [answerInput, setAnswerInput] = useState("");

//   // ---- Scroll to latest question
//   // useEffect(() => {
//   //   if (qnContainerRef.current) {
//   //     const container = qnContainerRef.current;
//   //     container.scrollTop = container.scrollHeight;
//   //   }
//   // }, [passCount]);

//   // ---- Handle Pass question
//   const handlePass = () => {
//     if (!currentQuestion) return;

//     if (isLastQuestion) {
//       setFinishQus(true);
//       pauseTimer();
//     } else {
//       nextQuestion();
//       setPassCount((prev) => prev + 1);
//       setAnswerInput("");
//     }
//   };

//   // ---- Handle answer submit
//   const handleInputChange = (e) => setAnswerInput(e.target.value);

//   const handleSubmit = () => {
//     const currentQ = quesFetched[passCount];

//     // Find the correct answer text
//     const correctAnswerText = currentQ.options?.find(
//       (opt) => opt.id === currentQ.correctOptionId
//     )?.text;

//     const isCorrect =
//       answerInput.trim().toLowerCase() === correctAnswerText?.toLowerCase();

//     showToast(isCorrect ? "✅ Correct!" : "❌ Wrong Answer!");

//     const inputEl = document.querySelector(".answer-input");
//     if (inputEl) {
//       inputEl.classList.add(isCorrect ? "correct-answer" : "wrong-answer");
//       setTimeout(
//         () => inputEl.classList.remove("correct-answer", "wrong-answer"),
//         1500
//       );
//     }

//     handlePass();
//     setAnswerInput("");
//     resetAnswer();
//   };

//   // Auto-handle when timer runs out
//   useEffect(() => {
//     if (timeRemaining === 0 && !finishQus && !finalFinished && roundStarted) {
//       setFinishQus(true);
//       pauseTimer();
//     }
//   }, [timeRemaining, finishQus, finalFinished, roundStarted]);

//   // ⚡ Handle team switch when finished
//   useEffect(() => {
//     if (finishQus) {
//       const nextTeamIndex = activeIndex + 1;

//       if (nextTeamIndex < queue.length) {
//         // Move to next team
//         showToast(
//           `🎯 Team ${activeTeam} finished! Next: Team ${queue[nextTeamIndex]}`
//         );
//         setTimeout(() => {
//           goToNextTeam();
//           resetTimer();
//           resetQuestion();
//           setFinishQus(false);
//           setPassCount(0);
//           // setAnswerInput("");
//           // startTimer();
//           setRoundStarted(false);
//         }, 2000);
//       } else {
//         // All teams done
//         showToast("🏁 All teams finished the quiz!");
//         setFinalFinished(true);
//       }
//     }
//   }, [finishQus]);

//   useEffect(() => {
//     const details = document.getElementsByClassName("detail-info");
//     Array.from(details).forEach(
//       (el) => (el.style.display = finalFinished ? "none" : "block")
//     );
//   }, [finalFinished]);

//   // SPACE to pass
//   useSpaceKeyPass(handlePass, [currentQuestion]);

//   // SHIFT key to show question
//   useShiftToShow(() => {
//     if (!roundStarted) {
//       startRound();
//     }
//   }, [roundStarted, activeTeam]);

//   // Start round button
//   const startRound = () => {
//     setRoundStarted(true);
//     startTimer();
//     showToast(`🏁 Team ${activeTeam} started their round!`);
//   };

//   useEffect(() => {
//     if (!roundStarted) {
//       pauseTimer();
//     }
//   }, [roundStarted]);

//   return (
//     <section className="quiz-container">
//       {/* Team Display */}
//       <TeamDisplay
//         activeTeam={activeTeam}
//         timeRemaining={timeRemaining}
//         TEAM_COLORS={TEAM_COLORS}
//         formatTime={formatTime}
//         toastMessage="Press 'Space' to Pass  to the Next Question"
//         headMessage="Answer All the Question under the time limit ( 2 mins )!"
//         lowTimer={30}
//         midTimer={60}
//         highTimer={120}
//       />

//       {!roundStarted && !finalFinished ? (
//         <>
//           {" "}
//           <div className="centered-control">
//             <button className="start-question-btn" onClick={startRound}>
//               Start Round 🏁
//             </button>
//           </div>
//         </>
//       ) : !finishQus && !finalFinished ? (
//         currentQuestion ? (
//           <>
//             {/* <section className="quiz-questions">
//             <div className="questions-container" ref={qnContainerRef}>
//               {quizData.slice(0, passCount + 1).map((ques, index) => (
//                 <div key={ques.id} className="qn">
//                   Q{index + 1}.{" "}
//                   {index === passCount ? displayedText : ques.question}
//                 </div>
//               ))}
//             </div>
//           </section> */}

//             <QuestionCard
//               questionText={currentQuestion?.question}
//               displayedText={`Q${passCount + 1}. ${displayedText}`}
//               mediaType={currentQuestion?.mediaType}
//               mediaUrl={currentQuestion?.mediaUrl}
//             />

//             <AnswerTextBox
//               value={answerInput}
//               onChange={handleInputChange}
//               onSubmit={handleSubmit}
//               placeholder="Enter your answer"
//             />
//           </>
//         ) : (
//           <p className="text-gray-400 mt-4">Loading questions...</p>
//         )
//       ) : finalFinished ? (
//         <FinishDisplay
//           onFinish={onFinish}
//           message="Rapid Fire Round Finished!"
//         />
//       ) : (
//         <div className="finished-msg">
//           <h1>Team {activeTeam} Finished!</h1>
//           <p>Preparing next team...</p>
//         </div>
//       )}

//       <div id="toast-container"></div>
//     </section>
//   );
// };

// export default RapidFireQuiz;
import React from "react";

const RapidFireQuiz = () => {
  return <div>RapidFireQuiz</div>;
};

export default RapidFireQuiz;
