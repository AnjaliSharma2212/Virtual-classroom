import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import LoadingSpinner from "../components/LoadingSpinner";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeContext } from "../context/ThemeContext";
interface Note {
  _id: string;
  title: string;
  description: string;
  filename: string;
  fileUrl: string;
  uploadedBy: string;
  sessionId: string;
  createdAt: string;
}

const NotesPage: React.FC = () => {
  const { darkMode } = useContext(ThemeContext);
  const token = localStorage.getItem("token") || "";
  const role =
    (localStorage.getItem("role") as "teacher" | "student") || "student";

  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL;
  // For teachers to manually enter sessionId
  const [manualSessionId, setManualSessionId] = useState("");
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  // // For students, fetch from localStorage
  // const studentSessionId = localStorage.getItem("sessionId") || "";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      let res;
      if (role === "teacher") {
        if (!manualSessionId) {
          setNotes([]);
          setLoading(false);
          return;
        }
        res = await axios.get(
          `${`${API_URL}api/notes/list`}/${manualSessionId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        // For students, fetch all notes
        res = await axios.get(`${`${API_URL}/api/notes/all`}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      setNotes(res.data.notes);
    } catch (err) {
      console.error("Failed to fetch notes.", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async () => {
    if (!manualSessionId || !title.trim() || !description.trim() || !file) {
      toast.error("Please fill all fields and select a file.");
      return;
    }

    const formData = new FormData();
    formData.append("sessionId", manualSessionId);
    formData.append("title", title);
    formData.append("description", description);
    formData.append("file", file);

    try {
      await axios.post(`${`${API_URL}/api/notes/upload`}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setTitle("");
      setDescription("");
      setFile(null);
      fetchNotes();
      toast.success("Note uploaded successfully!");
    } catch (err) {
      console.error("Upload failed", err);
      toast.error("Failed to upload note.");
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [manualSessionId, role]);

  if (!token) {
    return (
      <div className="p-4 text-center text-red-600">
        Missing token. Please login.
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-extrabold text-center mb-6 text-blue-700">
        📓 Session Notes 📚
      </h1>

      {role === "teacher" && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className={`mb-10 ${
            darkMode
              ? "bg-gray-800/80 border border-gray-700"
              : "bg-white border"
          } rounded-xl p-5`}
        >
          <input
            type="text"
            placeholder="Enter Session ID"
            value={manualSessionId}
            onChange={(e) => setManualSessionId(e.target.value)}
            className={`p-3 rounded-lg w-full mb-4 transition focus:ring-2 ${
              darkMode
                ? "bg-gray-900 text-white border-gray-600 focus:ring-blue-500"
                : "bg-gray-100 text-black border-gray-300 focus:ring-blue-400"
            }`}
          />
          <button
            onClick={fetchNotes}
            className={`px-2 py-2 rounded-lg font-semibold transition transform hover:scale-105 ${
              !manualSessionId
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
            disabled={!manualSessionId}
          >
            Load Session Notes
          </button>

          {manualSessionId && (
            <motion.div className="border p-4 rounded bg-gray-100 mb-6 bg-gray-500 m-5">
              <h2 className="font-bold text-lg mb-3 text-center text-white ">
                {" "}
                ➕ <i>Upload New Note</i>
              </h2>
              <input
                type="text"
                placeholder="Note Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`p-2 w-full mb-3 rounded-lg ${
                  darkMode
                    ? "bg-gray-900 text-white border-gray-600"
                    : "bg-white text-black border border-gray-300"
                }`}
              />
              <textarea
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`p-2 w-full mb-3 rounded-lg ${
                  darkMode
                    ? "bg-gray-900 text-white border-gray-600"
                    : "bg-white text-black border border-gray-300"
                }`}
              />
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="mb-4 text-black"
              />
              <button
                onClick={handleFileUpload}
                className="bg-green-600 hover:bg-green-700 transform hover:scale-105 transition duration-300 text-white px-5 py-2 rounded-lg font-semibold"
              >
                Upload Note
              </button>
            </motion.div>
          )}
        </motion.div>
      )}

      {loading ? (
        <motion.div
          key="loader"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <LoadingSpinner />
        </motion.div>
      ) : notes.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400">
          {role === "teacher"
            ? "No notes uploaded yet. Enter Session ID to add notes."
            : "No notes available currently."}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {notes.map((note, index) => (
            <motion.div
              key={note._id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              className={`rounded-xl shadow-lg border cursor-pointer transition duration-300 ${
                darkMode
                  ? "bg-gray-800/80 border-gray-700 hover:border-indigo-400"
                  : "bg-white border-gray-200 hover:border-indigo-300"
              }`}
              onClick={() => setSelectedNote(note)}
            >
              <h3
                className={`shadow-lg text-center cursor-pointer transition duration-300 p-3 ${
                  darkMode
                    ? "bg-gray-800/80 border-gray-700 hover:border-indigo-400"
                    : "bg-white border-gray-200 hover:border-indigo-300"
                }`}
              >
                {note.title}
              </h3>
              <p className="text-sm text-center text-gray-600 mb-2">
                {note.description}
              </p>

              {note.filename.endsWith(".pdf") ? (
                <iframe
                  src={note.fileUrl}
                  title={note.title}
                  className="mt-2 w-full p-3 h-52 rounded-lg text-center"
                />
              ) : (
                <img
                  src={note.fileUrl}
                  alt={note.title}
                  className="mt-2 w-full h-48 object-contain rounded-lg"
                />
              )}
              <div className="mt-4 flex flex-wrap gap-2 flex-row justify-center items-center space-x-2 p-3 ">
                <p className="text-blue-600 bg-blue-500 text-white px-4 py-2 text-center text-sm mt-2 cursor-pointer rounded-lg font-medium hover:bg-blue-700">
                  Click to Preview
                </p>
                <a
                  href={note.fileUrl}
                  download
                  className="mt-2 text-white text-center text-sm bg-green-500 px-4 py-2 rounded-lg cursor-pointer  hover:bg-green-600"
                  onClick={(e) => e.stopPropagation()}
                >
                  Download
                </a>

                {role === "teacher" && (
                  <button
                    className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg font-semibold"
                    onClick={async (e) => {
                      e.stopPropagation();
                      await axios.delete(
                        `${`${API_URL}/api/notes`}/${note._id}`,
                        {
                          headers: { Authorization: `Bearer ${token}` },
                        }
                      );
                      fetchNotes();
                    }}
                  >
                    Delete
                  </button>
                )}
              </div>
            </motion.div>
          ))}
          <AnimatePresence>
            {selectedNote && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
              >
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.8 }}
                  transition={{ duration: 0.3 }}
                  className={`relative rounded-2xl shadow-xl max-w-5xl w-[95%] h-[90vh] p-4 ${
                    darkMode
                      ? "bg-gray-900 text-white"
                      : "bg-white text-gray-900"
                  }`}
                >
                  <button
                    className="absolute top-3 right-3 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold"
                    onClick={() => setSelectedNote(null)}
                  >
                    Close
                  </button>

                  <h2 className="font-bold text-2xl mb-2">
                    {selectedNote.title}
                  </h2>
                  <p className="text-gray-600 mb-4">
                    {selectedNote.description}
                  </p>

                  {selectedNote.filename.endsWith(".pdf") ? (
                    <iframe
                      src={selectedNote.fileUrl}
                      title={selectedNote.title}
                      className="w-full h-full border"
                    />
                  ) : (
                    <img
                      src={selectedNote.fileUrl}
                      alt={selectedNote.title}
                      className="w-full h-full object-contain rounded-xl"
                    />
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default NotesPage;
