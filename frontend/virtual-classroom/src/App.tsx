import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ClassroomPage from "./pages/ClassRoomPage";
import LoginPage from "./pages/loginpage";
import RegisterPage from "./pages/Register";
import TeacherDashboard from "./pages/TeacherDashboard";
import StudentDashboard from "./pages/StudentDashboard";

import Layout from "./components/Layout";
import Notes from "./pages/Notes";
import ChatPage from "./pages/ChatPage";
import ForgotPasswordPage from "./pages/Forget-PasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

function App() {
  const teacherId = localStorage.getItem("userId") || "";
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="/classroom/:sessionId" element={<ClassroomPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route
              path="/reset-password/:token"
              element={<ResetPasswordPage />}
            />
            <Route path="/notes" element={<Notes />} />
            <Route path="/chats" element={<ChatPage />} />
            <Route
              path="/teacher-dashboard"
              element={<TeacherDashboard teacherId={teacherId} />}
            />
            <Route path="/student-dashboard" element={<StudentDashboard />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
