import { Route, Routes } from "react-router-dom";
import "./App.css";
import { ThemeProvider } from "styled-components";
import QuizApp from "./components/Fetch";
import AuthForm from "./pages/admin/Login";
import TeamManager from "./components/Team";
import TeamList from "./pages/admin/TeamList";
import RoundGrid from "./components/Category";
import AdminLayout from "./pages/admin/Sidebar";
import Dashboard from "./pages/admin/Dashboard";
import Questions from "./pages/admin/Questions";
import Teams from "./pages/admin/Team";
import Rounds from "./pages/admin/Rounds";
import Create from "./pages/admin/Create";
import ManageQuestions from "./pages/admin/dashboard/ManageQuestions";

import Home from "./pages/user/Home";
import ErrorPage from "./pages/user/ErrorPage";
import RoundSelect from "./pages/user/RoundSelect";
import RoundIntro from "./pages/user/RoundIntro";

import QuizWrapper from "./components/QuizWrapper";

import ResultsPage from "./pages/user/ResultsPage";
import QuizMasterLogin from "./pages/user/QuizMasterLogin";
import QuizSelector from "./pages/user/QuizSelector";
import { GlobalStyle } from "./GlobalStyle";

import GeneralRound from "./components/quiz_rounds/GeneralRound";
import SubjectRound from "./components/quiz_rounds/SubjectRound";
import RapidFireRound from "./components/quiz_rounds/RapidFireRound";
import BuzzerRound from "./components/quiz_rounds/BuzzerRound";
import EstimationRound from "./components/quiz_rounds/EstimationRound";
import ManageQuizMasters from "./pages/admin/dashboard/ManageQuizMasters";
import ManageQuizzes from "./pages/admin/dashboard/ManageQuizzes";
import History from "./pages/admin/History";
import TeamStats from "./pages/admin/dashboard/TeamStats";

function App() {
  const theme = {
    colors: {
      heading: "#18181d",
      text: "rgba(29, 29, 29, 0.8)",
      white: "#fff",
      black: "#212529",
      helper: "#8490ff",
      bg: "#f2f2f2",
      footer_bg: "rgb(39, 51, 51)",
      btn: "rgb(44, 55, 61)",
      border: "rgba(54, 54, 54, 0.5)",
      hr: "#ffffff",
      gradient:
        "linear-gradient(0deg, rgb(132 144 255) 0%, rgb(98 189 252) 100%)",
      shadow:
        "rgba(0, 0, 0, 0.02) 0px 1px 3px 0px, rgba(27, 31, 35, 0.15) 0px 0px 0px 1px;",
      shadowSupport: "rgba(0, 0, 0, 0.16) 0px 1px 4px",
    },
    media: {
      mobile: "768px",
      tab: "998px",
    },
  };

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<AuthForm />} />
        <Route path="/team" element={<TeamManager />} />
        <Route path="/quiz" element={<QuizApp />} />
        <Route path="/team-list" element={<TeamList />} />
        <Route path="/category" element={<RoundGrid />} />

        <Route path="/home/:quizId" element={<Home />} />
        <Route path="/roundselect/:quizId" element={<RoundSelect />} />
        <Route path="*" element={<ErrorPage />} />
        {/* <Route path="/round/:quizType" element={<RoundIntro />} /> */}

        <Route path="/quizselect" element={<QuizSelector />} />
        <Route path="/round/:quizId/:roundId" element={<RoundIntro />} />

        <Route
          path="/quiz/:quizId/round/:roundId/general"
          element={
            <QuizWrapper quizKey="general">
              <GeneralRound />
            </QuizWrapper>
          }
        />
        <Route
          path="/quiz/:quizId/round/:roundId/rapidfire"
          element={
            <QuizWrapper quizKey="rapidfire">
              <RapidFireRound />
            </QuizWrapper>
          }
        />
        <Route
          path="/quiz/:quizId/round/:roundId/buzzer"
          element={
            <QuizWrapper quizKey="buzzer">
              <BuzzerRound />
            </QuizWrapper>
          }
        />
        <Route
          path="/quiz/:quizId/round/:roundId/estimation"
          element={
            <QuizWrapper quizKey="estimation">
              <EstimationRound />
            </QuizWrapper>
          }
        />
        <Route
          path="/quiz/:quizId/round/:roundId/subjective"
          element={
            <QuizWrapper quizKey="subjective">
              <SubjectRound />
            </QuizWrapper>
          }
        />

        {/* Scoreboard */}
        <Route path="/result/:quizId" element={<ResultsPage />} />

        {/* Admin routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<Dashboard />}>
            <Route path="manage-quizzes" element={<ManageQuizzes />} />
            <Route path="manage-questions" element={<ManageQuestions />} />
            <Route path="manage-quizmasters" element={<ManageQuizMasters />} />
          </Route>

          <Route path="teams" element={<Teams />} />
          <Route path="questions" element={<Questions />} />
          <Route path="rounds" element={<Rounds />} />
          <Route path="create" element={<Create />} />
          <Route path="history" element={<History />}>
            <Route path="team-stats" element={<TeamStats />} />
          </Route>
        </Route>
      </Routes>
    </ThemeProvider>
  );
}

export default App;
