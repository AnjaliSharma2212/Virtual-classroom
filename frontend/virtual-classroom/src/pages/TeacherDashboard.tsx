import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import LoadingSpinner from "../components/LoadingSpinner";
import { ThemeContext } from "../context/ThemeContext";

interface Session {
  _id: string;
  title: string;
  description: string;
  startedAt: string;
  startTime: string;
  endTime: string;
  scheduledDate: string;
  isCompleted: boolean;
}

const TeacherDashboard: React.FC<{ teacherId: string }> = ({ teacherId }) => {
  const { darkMode } = useContext(ThemeContext);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [title, setTitle] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [editedStartTime, setEditedStartTime] = useState("");
  const [editedEndTime, setEditedEndTime] = useState("");

  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;

  const fetchSessions = async () => {
    try {
      setFetching(true);
      const res = await axios.get(
        `${API_URL}/api/sessions/teacher/${teacherId}`
      );
      setSessions(res.data);
    } catch {
      setError("Failed to fetch sessions.");
    } finally {
      setFetching(false);
    }
  };
  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 60000); // every 60 seconds
    return () => clearInterval(interval);
  }, [teacherId]);

  const createSession = async () => {
    if (!title.trim()) {
      toast.error("Please enter the session title.");
      return;
    }

    if (!description.trim()) {
      toast.error("Please enter the session description.");
      return;
    }

    if (!startTime.trim()) {
      toast.error("Please select the start time.");
      return;
    }

    if (!endTime.trim()) {
      toast.error("Please select the end time.");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(`${API_URL}/api/sessions/create`, {
        title,
        description,
        teacherId,
        startTime,
        endTime,
        scheduledDate,
      });
      const newSession = res.data;
      localStorage.setItem("sessionId", newSession._id);
      setTitle("");
      setDescription("");
      fetchSessions();
      toast.success("Session created successfully!");
    } catch {
      setError("Failed to create session.");
      toast.error("Failed to create session ❌.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await axios.delete(`${API_URL}/api/sessions/${sessionId}`);
      toast.success("Session deleted successfully!");
      fetchSessions();
    } catch {
      setError("Failed to delete session.");
      toast.error("Failed tp delete Session !");
    }
  };

  const openEditMode = (session: Session) => {
    setEditingSessionId(session._id);
    setEditedTitle(session.title);
    setEditedDescription(session.description);
    setEditedStartTime(session.startTime);
    setEditedEndTime(session.endTime);
  };
  const formatTimeToAMPM = (timeStr: string) => {
    if (!timeStr || !timeStr.includes(":")) return timeStr;

    const [hourStr, minuteStr] = timeStr.split(":");
    const date = new Date();
    date.setHours(parseInt(hourStr));
    date.setMinutes(parseInt(minuteStr));

    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };
  const markAsCompleted = async (sessionId: string) => {
    await axios.put(`${API_URL}/api/sessions/${sessionId}/complete`);
    fetchSessions();
  };

  const handleEditSave = async () => {
    if (!editingSessionId) return;
    try {
      setLoading(true);
      await axios.put(`${API_URL}/api/sessions/${editingSessionId}`, {
        title: editedTitle,
        description: editedDescription,
        startTime: editedStartTime,
        endTime: editedEndTime,
      });
      toast.success("Session updated successfully!");
      setEditingSessionId(null);
      fetchSessions();
    } catch {
      setError("Failed to edit session.");
      toast.error("Failed to Edit Session!");
    } finally {
      setLoading(false);
    }
  };
  const canJoinSession = (session: Session) => {
    // Assuming backend includes isActive
    if ((session as any).isActive === false) return false;

    const [hour, minute] = session.startTime.split(":").map(Number);
    const sessionStart = new Date();
    sessionStart.setHours(hour);
    sessionStart.setMinutes(minute);
    sessionStart.setSeconds(0);

    const now = new Date();
    const diffMs = sessionStart.getTime() - now.getTime();

    // Allow join if session starts within next 5 minutes
    return diffMs <= 5 * 60 * 1000 && diffMs >= -60 * 60 * 1000; // also allows during session time
  };

  useEffect(() => {
    fetchSessions();
  }, [teacherId]);

  return (
    <div
      className={`min-h-screen px-4 py-6 mx-auto ${
        darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-800"
      }`}
    >
      <ToastContainer />
      <h2 className="font-bold text-2xl mb-6 text-center text-indigo-900 dark:text-indigo-600">
        {" "}
        🎓 Teacher Dashboard
      </h2>

      {error && <p className="text-red-500 text-center mb-4">{error}</p>}
      <div
        className={`flex flex-col justify-center items-center text-center rounded-xl p-5 transition-all
        ${
          darkMode
            ? "bg-gray-800/80 text-white border border-gray-700"
            : "bg-white text-gray-800 shadow-lg border border-gray-200"
        }`}
      >
        <h3 className="font-semibold text-xl text-center mb-2">
          Create New Session
        </h3>
        <input
          type="text"
          placeholder="Session Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={`border rounded w-full p-3 mb-3 focus:ring-2 focus:ring-indigo-400 transition 
            ${
              darkMode
                ? "bg-gray-900 border-gray-700 text-white"
                : "bg-white border-gray-300 text-gray-800"
            }`}
          required
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={`border rounded w-full p-3 mb-3 focus:ring-2 focus:ring-indigo-400 transition 
            ${
              darkMode
                ? "bg-gray-900 border-gray-700 text-white"
                : "bg-white border-gray-300 text-gray-800"
            }`}
          required
        />
        <input
          type="date"
          value={scheduledDate}
          onChange={(e) => setScheduledDate(e.target.value)}
          className={`border rounded w-full p-3 mb-3 focus:ring-2 focus:ring-indigo-400 transition 
            ${
              darkMode
                ? "bg-gray-900 border-gray-700 text-white"
                : "bg-white border-gray-300 text-gray-800"
            }`}
          required
        />
        <div className="flex gap-2 mb-4">
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className={`border rounded w-1/2 p-3 focus:ring-2 focus:ring-indigo-400 transition 
              ${
                darkMode
                  ? "bg-gray-900 border-gray-700 text-white"
                  : "bg-white border-gray-300 text-gray-800"
              }`}
            required
          />
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className={`border rounded w-1/2 p-3 focus:ring-2 focus:ring-indigo-400 transition 
              ${
                darkMode
                  ? "bg-gray-900 border-gray-700 text-white"
                  : "bg-white border-gray-300 text-gray-800"
              }`}
            required
          />
        </div>
        <button
          onClick={createSession}
          className={`px-2 py-2 rounded font-semibold text-white transition ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.02]"
          }`}
        >
          {loading ? "Creating..." : "Create Session ➕"}
        </button>
      </div>

      <div className="mt-6 flex flex-row gap-6">
        {fetching ? (
          <LoadingSpinner />
        ) : sessions.length === 0 ? (
          <p className="text-center text-gray-500 font-medium">
            No sessions found.
          </p>
        ) : (
          sessions.map((session) => (
            <div
              key={session._id}
              className={`rounded-xl shadow-lg border transition hover:shadow-2xl hover:scale-[1.02] p-5
                ${
                  darkMode
                    ? "bg-gray-800/70 border-gray-700 hover:border-indigo-400 text-white"
                    : "bg-white border-gray-200 hover:border-indigo-300 text-gray-800"
                }`}
            >
              {editingSessionId === session._id ? (
                <>
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className={`border rounded w-full p-2 mb-2
                      ${
                        darkMode
                          ? "bg-gray-900 border-gray-700 text-white"
                          : "bg-white border-gray-300 text-gray-800"
                      }`}
                  />
                  <textarea
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                    className={`border rounded w-full p-2 mb-2
                      ${
                        darkMode
                          ? "bg-gray-900 border-gray-700 text-white"
                          : "bg-white border-gray-300 text-gray-800"
                      }`}
                  />

                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className={`border rounded w-full p-2 mb-2
                      ${
                        darkMode
                          ? "bg-gray-900 border-gray-700 text-white"
                          : "bg-white border-gray-300 text-gray-800"
                      }`}
                  />

                  <div className="flex gap-2 mb-2">
                    <input
                      type="time"
                      value={editedStartTime}
                      onChange={(e) => setEditedStartTime(e.target.value)}
                      className={`border rounded w-1/2 p-2
                        ${
                          darkMode
                            ? "bg-gray-900 border-gray-700 text-white"
                            : "bg-white border-gray-300 text-gray-800"
                        }`}
                    />

                    <input
                      type="time"
                      value={editedEndTime}
                      onChange={(e) => setEditedEndTime(e.target.value)}
                      className="border p-2 mb-2 w-1/2 rounded"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleEditSave}
                      disabled={loading}
                      className={`flex-1 px-1 rounded text-white font-semibold ${
                        loading
                          ? "bg-gray-400"
                          : "bg-green-600 hover:bg-green-700"
                      }`}
                    >
                      {loading ? "Saving..." : "Save✅"}
                    </button>
                    <button
                      onClick={() => setEditingSessionId(null)}
                      className="flex-1 px-2 py-2 bg-gray-600 hover:bg-gray-700 rounded text-white font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="font-bold text-lg text-indigo-700">
                    <strong>{session.title}</strong>
                  </h3>
                  <p className="text-gray-600">{session.description}</p>
                  <p className="text-sm text-gray-400">
                    Created At: {new Date(session.startedAt).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-700 my-1">
                    <strong>Time:</strong> ⏰
                    {formatTimeToAMPM(session.startTime)} to{" "}
                    {formatTimeToAMPM(session.endTime)}⏰
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>Scheduled Date:</strong> {session.scheduledDate}
                  </p>

                  <p
                    className={`font-semibold ${
                      session.isCompleted ? "text-green-600" : "text-yellow-600"
                    }`}
                  >
                    {session.isCompleted
                      ? "✅ Session Completed"
                      : "⏳ Session Upcoming"}
                  </p>
                  {!session.isCompleted && (
                    <button
                      onClick={() => markAsCompleted(session._id)}
                      className="flex-1 px-1 py-2 bg-green-500 hover:bg-green-600 rounded text-white font-semibold transition"
                    >
                      ✅ Mark Completed
                    </button>
                  )}

                  {(session as any).isActive === false ? (
                    <p className="text-red-600 font-semibold">
                      {" "}
                      🔴 Session Ended
                    </p>
                  ) : canJoinSession(session) ? (
                    <button
                      onClick={() => {
                        localStorage.setItem("sessionId", session._id);
                        navigate(`/classroom/${session._id}`);
                      }}
                      className="py-2 px-2 bg-blue-600 hover:bg-blue-700 rounded text-white font-semibold transition mb-2"
                    >
                      Join Session
                    </button>
                  ) : (
                    <p className="text-yellow-600 font-semibold">
                      Join available 5 minutes before start
                    </p>
                  )}
                  <div className="flex flex-wrap justify-center gap-3 mt-2">
                    <button
                      onClick={() => handleDeleteSession(session._id)}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded text-white font-semibold transition transform hover:scale-105"
                    >
                      🗑️ Delete
                    </button>
                    <button
                      onClick={() => openEditMode(session)}
                      className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 rounded text-white font-semibold transition transform hover:scale-105"
                    >
                      ✏️ Edit
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;
