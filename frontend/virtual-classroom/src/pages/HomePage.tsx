import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { ThemeContext } from "../context/ThemeContext";

const HomePage: React.FC = () => {
  const [sessionId, setSessionId] = useState("");
  const navigate = useNavigate();
  const { darkMode } = useContext(ThemeContext);

  const handleJoin = () => {
    if (sessionId.trim()) {
      navigate(`/classroom/${sessionId}`);
    }
  };

  const handleCreateSession = () => {
    const newSessionId = uuidv4();
    navigate(`/classroom/${newSessionId}`);
  };

  return (
    <div
      className={`flex flex-col items-center justify-center min-h-screen px-4 ${
        darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"
      } transition-colors duration-300`}
    >
      <div className="max-w-md w-full space-y-8 p-8 rounded-2xl shadow-xl bg-gradient-to-br from-blue-100 via-white to-green-100 dark:from-gray-800 dark:to-gray-900">
        <h1 className="text-3xl font-extrabold text-center mb-4 tracking-tight">
          🎓 Welcome to Virtual Classroom
        </h1>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-8">
          Join a live class or create your own session in seconds!
        </p>

        <input
          type="text"
          value={sessionId}
          onChange={(e) => setSessionId(e.target.value)}
          placeholder="Enter Session ID"
          className="border rounded-lg w-full px-4 py-2 mb-4 focus:ring-2 focus:ring-blue-400 text-black"
        />

        <button
          onClick={handleJoin}
          className={`w-full py-3 rounded-lg font-semibold text-white transition duration-300 ${
            sessionId.trim()
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-gray-400 cursor-not-allowed"
          }`}
          disabled={!sessionId.trim()}
        >
          Join Existing Session
        </button>

        <div className="text-center text-sm text-gray-400 my-2">OR</div>

        <button
          onClick={handleCreateSession}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition duration-300"
        >
          Create New Session 🚀
        </button>
      </div>
    </div>
  );
};

export default HomePage;
