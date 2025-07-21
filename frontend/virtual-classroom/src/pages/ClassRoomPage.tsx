import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { type RootState } from "../store/store";
import MultiUserVideoGrid from "../components/MultiUserVideoGrid";
import Whiteboard from "../components/Whiteboard";

import TeacherControls from "../components/TeacherControllers";
import axios from "axios";
import ScreenShareComponent from "../components/ScreenShare";
import ChatPage from "./ChatPage";
import VideoGrid from "../components/VideoGrid";

const ClassroomPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const role = useSelector((state: RootState) => state.classroom.role);

  const API_URL = import.meta.env.VITE_API_URL;
  const [sessionTitle, setSessionTitle] = useState<string>("");

  useEffect(() => {
    const fetchSessionDetails = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/sessions/${sessionId}`);
        setSessionTitle(res.data.title);
      } catch {
        setSessionTitle("Unknown Session");
      }
    };

    if (sessionId) fetchSessionDetails();
  }, [sessionId]);

  if (!sessionId) {
    return (
      <p className="text-center text-red-500 font-bold">Invalid session ID.</p>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 dark:from-gray-800 dark:to-gray-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto py-8 px-4">
        <h2 className="text-2xl font-bold text-center mb-6 dark:text-white">
          🎥 Classroom: {sessionTitle}
        </h2>

        <div className="rounded-xl bg-white/70 dark:bg-white/10 backdrop-blur-md shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-8 p-4">
          <MultiUserVideoGrid sessionId={sessionId} />
          <VideoGrid />
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 space-y-4">
            <div className="rounded-xl bg-white/70 dark:bg-white/10 backdrop-blur-md shadow-lg border border-gray-200 dark:border-gray-700 p-4">
              <Whiteboard sessionId={sessionId} />
            </div>

            {role === "teacher" && (
              <div className="rounded-xl bg-white/70 dark:bg-white/10 backdrop-blur-md shadow-lg border border-gray-200 dark:border-gray-700 p-4">
                <TeacherControls sessionId={sessionId} />
              </div>
            )}
            <button>
              {" "}
              <ScreenShareComponent sessionId={sessionId!} role="teacher" />
            </button>
          </div>

          <div className="w-full lg:w-1/3">
            <div className="rounded-xl bg-white/70 dark:bg-white/10 backdrop-blur-md shadow-lg border border-gray-200 dark:border-gray-700 p-4 h-full flex flex-col">
              <ChatPage />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassroomPage;
