import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { type RootState } from "../store/store";
import socket from "../services/socket";

const VideoGrid: React.FC = () => {
  const role = useSelector((state: RootState) => state.classroom.role);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [audioOn, setAudioOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((localStream) => {
        setStream(localStream);
      });

    // Listen for teacher mute-all command
    socket.on("teacher-mute-all", () => {
      forceMuteAudio();
    });

    return () => {
      socket.off("teacher-mute-all");
    };
  }, []);

  const toggleAudio = () => {
    if (stream) {
      const enabled = !audioOn;
      stream.getAudioTracks().forEach((track) => (track.enabled = enabled));
      setAudioOn(enabled);
    }
  };

  const toggleVideo = () => {
    if (stream) {
      const enabled = !videoOn;
      stream.getVideoTracks().forEach((track) => (track.enabled = enabled));
      setVideoOn(enabled);
    }
  };

  const forceMuteAudio = () => {
    if (stream) {
      stream.getAudioTracks().forEach((track) => (track.enabled = false));
      setAudioOn(false);
    }
  };

  const teacherMuteAll = () => {
    socket.emit("teacher-mute-all");
  };

  return (
    <div className="p-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <video
            ref={(video) => {
              if (video && stream) {
                video.srcObject = stream;
                video.onloadedmetadata = () => video.play();
              }
            }}
            autoPlay
            muted
            className="rounded-lg border w-full h-60 bg-black"
          />

          <div className="mt-2 flex gap-2">
            <button
              onClick={toggleAudio}
              className={`px-3 py-1 rounded ${
                audioOn ? "bg-red-500" : "bg-green-500"
              } text-white`}
            >
              {audioOn ? "Mute" : "Unmute"}
            </button>
            <button
              onClick={toggleVideo}
              className={`px-3 py-1 rounded ${
                videoOn ? "bg-red-500" : "bg-green-500"
              } text-white`}
            >
              {videoOn ? "Camera Off" : "Camera On"}
            </button>
          </div>
        </div>
      </div>

      {role === "teacher" && (
        <div className="mt-4">
          <h3 className="font-semibold">Teacher Controls</h3>
          <button
            onClick={teacherMuteAll}
            className="bg-blue-600 text-white px-4 py-2 rounded mt-2"
          >
            Mute All Students
          </button>
        </div>
      )}
    </div>
  );
};

export default VideoGrid;
