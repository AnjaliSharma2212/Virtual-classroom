import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ThemeContext } from "../context/ThemeContext";

interface Session {
  _id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  startedAt: string;
  isActive?: boolean;
}

const StudentDashboard: React.FC = () => {
  const { darkMode } = useContext(ThemeContext);
  const [sessions, setSessions] = useState<Session[]>([]);
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;

  const fetchSessions = async () => {
    const res = await axios.get(`${API_URL}/api/sessions/active`);
    setSessions(res.data);
  };

  const isSessionOver = (session: Session) => {
    const [hour, minute] = session.endTime.split(":").map(Number);
    const sessionEnd = new Date();
    sessionEnd.setHours(hour);
    sessionEnd.setMinutes(minute);
    sessionEnd.setSeconds(0);

    const now = new Date();
    return now.getTime() > sessionEnd.getTime();
  };

  const canJoinSession = (session: Session) => {
    if (session.isActive === false) return false;
    const [hour, minute] = session.startTime.split(":").map(Number);
    const sessionStart = new Date();
    sessionStart.setHours(hour);
    sessionStart.setMinutes(minute);
    sessionStart.setSeconds(0);

    const now = new Date();
    const diffMs = sessionStart.getTime() - now.getTime();
    return diffMs <= 5 * 60 * 1000 && !isSessionOver(session);
  };

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`min-h-screen px-4 py-6 mx-auto ${
        darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-800"
      }`}
    >
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
        Student Dashboard
      </h2>

      <div
        className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 "${
          darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-800"
        }`}
      >
        {sessions.map((session) => {
          const sessionEnded = isSessionOver(session);

          return (
            <div
              key={session._id}
              className={` rounded-2xl border border-gray-300 text-gray-400 p-5 shadow hover:shadow-lg transition "${
                darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-800"
              }`}
            >
              <h3 className="text-lg font-semibold mb-2">{session.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                {session.description}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Started At: {new Date(session.startedAt).toLocaleString()}
              </p>

              {sessionEnded || session.isActive === false ? (
                <p className="text-red-500 font-semibold">Session Ended</p>
              ) : canJoinSession(session) ? (
                <button
                  onClick={() => {
                    localStorage.setItem("sessionId", session._id);
                    navigate(`/classroom/${session._id}`);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium mt-2 transition"
                >
                  Join Session
                </button>
              ) : (
                <p className="text-yellow-500 font-medium">
                  Join 5 min before start
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StudentDashboard;
