import React, { useEffect, useState } from "react";
import socket from "../services/socket";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

interface Props {
  sessionId: string;
}

interface Student {
  socketId: string;
  name: string;
}

const TeacherControls: React.FC<Props> = ({ sessionId }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const API_URL = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();
  useEffect(() => {
    // Listen when students join
    socket.on("user-joined", ({ userId, socketId }) => {
      setStudents((prev) => [
        ...prev,
        { socketId, name: `Student-${userId.substring(0, 4)}` },
      ]);
    });

    // Listen when students leave
    socket.on("user-left", ({ socketId }) => {
      setStudents((prev) => prev.filter((s) => s.socketId !== socketId));
    });

    return () => {
      socket.off("user-joined");
      socket.off("user-left");
    };
  }, []);

  const handleEndSession = async () => {
    try {
      const response = await axios.patch(
        `${API_URL}/api/sessions/${sessionId}/end`
      );
      console.log("Session ended:", response.data);

      socket.emit("session-ended", { sessionId });
      toast.success("Session ended successfully.");
      navigate("/");
    } catch (error) {
      console.error("Failed to end session:", error);
      toast.error("Failed to end session.");
    }
  };

  const handleMuteAll = () => {
    socket.emit("teacher-mute-all", { sessionId });
  };

  const handleMuteStudent = (targetSocketId: string) => {
    socket.emit("teacher-mute-student", { sessionId, targetSocketId });
  };

  return (
    <div className="p-4 bg-gray-100 rounded shadow">
      <h3 className="font-semibold mb-2">Teacher Controls</h3>

      <button
        onClick={handleMuteAll}
        className="bg-red-600 text-white px-4 py-2 rounded mb-4"
      >
        Mute All Students
      </button>

      {students.length === 0 ? (
        <p>No students connected.</p>
      ) : (
        students.map((student) => (
          <button
            key={student.socketId}
            onClick={() => handleMuteStudent(student.socketId)}
            className="bg-yellow-500 text-white px-4 py-1 rounded mt-2 block w-full"
          >
            Mute {student.name}
          </button>
        ))
      )}

      <button
        onClick={handleEndSession}
        className="bg-black text-white px-4 py-2 rounded mt-4"
      >
        End Session
      </button>
    </div>
  );
};

export default TeacherControls;
