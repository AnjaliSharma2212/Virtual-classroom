import React, { useEffect, useState } from "react";
import axios from "axios";

interface Note {
  _id: string;
  title: string;
  description: string;
  filename: string;
  fileUrl: string;
  sessionId: string;
}

interface Props {
  sessionId: string;
  role: "teacher" | "student";
  token: string; // Pass the JWT token
}

const NotesUploader: React.FC<Props> = ({ sessionId, role, token }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL;
  const fetchNotes = async () => {
    try {
      const res = await axios.get(
        `${`${API_URL}/api/notes/list`}/${sessionId}`
      );
      setNotes(res.data.notes || []);
    } catch (err) {
      console.error("Failed to fetch notes:", err);
    }
  };

  const handleUpload = async () => {
    if (!title || !description || !file) {
      alert("Please fill all fields and select a file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    formData.append("description", description);
    formData.append("sessionId", sessionId);

    try {
      setLoading(true);
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
    } catch (err) {
      alert("Upload failed. Check file or permissions.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (noteId: string) => {
    if (role !== "teacher") return;
    if (!window.confirm("Are you sure you want to delete this note?")) return;

    try {
      await axios.delete(`${`${API_URL}/api/notes`}/${noteId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchNotes();
    } catch (err) {
      alert("Delete failed.");
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [sessionId]);

  return (
    <div className="p-4">
      {role === "teacher" && (
        <div className="mb-6 bg-white p-4 shadow rounded">
          <h2 className="font-bold text-lg mb-2">Upload New Note</h2>

          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border p-2 mb-2 w-full"
          />

          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="border p-2 mb-2 w-full"
          />

          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="mb-2"
          />

          <button
            onClick={handleUpload}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            {loading ? "Uploading..." : "Upload Note"}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {notes.map((note) => (
          <div key={note._id} className="border rounded shadow p-4 bg-white">
            <h3 className="font-semibold">{note.title}</h3>
            <p className="text-sm text-gray-600 mb-2">{note.description}</p>

            {note.filename.endsWith(".pdf") ? (
              <iframe
                src={note.fileUrl}
                title={note.title}
                className="w-full h-64 border mb-2"
              ></iframe>
            ) : (
              <p>No Preview Available</p>
            )}

            <a
              href={note.fileUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="block text-blue-600 underline text-sm mb-2"
            >
              Download as PDF
            </a>

            {role === "teacher" && (
              <button
                onClick={() => handleDelete(note._id)}
                className="bg-red-600 text-white px-3 py-1 rounded text-sm"
              >
                Delete
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotesUploader;
