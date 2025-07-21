import React, { useEffect, useRef, useState } from "react";
import socket from "../services/socket";

const configuration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

interface Props {
  role: "teacher" | "student";
  sessionId: string;
}

const ScreenShareComponent: React.FC<Props> = ({ role, sessionId }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isSharing, setIsSharing] = useState(false);
  const peers = useRef<{ [id: string]: RTCPeerConnection }>({});
  const localStream = useRef<MediaStream | null>(null);

  // --- Socket & WebRTC Setup ---
  useEffect(() => {
    socket.emit("join-session", sessionId);

    // Teacher: Handle new student joining
    socket.on("user-joined", async ({ userId }: { userId: string }) => {
      if (role !== "teacher" || !localStream.current) return;

      const peer = new RTCPeerConnection(configuration);
      peers.current[userId] = peer;

      localStream.current.getTracks().forEach((track) => {
        peer.addTrack(track, localStream.current!);
      });

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);

      socket.emit("offer", { to: userId, offer });

      peer.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit("ice-candidate", { to: userId, candidate: e.candidate });
        }
      };
    });

    // Student: Receive offer from teacher
    socket.on("offer", async ({ from, offer }) => {
      if (role !== "student") return;

      const peer = new RTCPeerConnection(configuration);
      peers.current[from] = peer;

      peer.ontrack = (e) => {
        if (videoRef.current) {
          videoRef.current.srcObject = e.streams[0];
        }
      };

      await peer.setRemoteDescription(offer);

      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);

      socket.emit("answer", { to: from, answer });

      peer.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit("ice-candidate", { to: from, candidate: e.candidate });
        }
      };
    });

    // Handle answer (Teacher)
    socket.on("answer", async ({ from, answer }) => {
      await peers.current[from]?.setRemoteDescription(answer);
    });

    // Handle ICE candidates
    socket.on("ice-candidate", async ({ from, candidate }) => {
      await peers.current[from]?.addIceCandidate(candidate);
    });

    // Cleanup on component unmount
    return () => {
      Object.values(peers.current).forEach((peer) => peer.close());
      peers.current = {};
      socket.off("user-joined");
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
    };
  }, [role, sessionId]);

  // --- Start Screen Sharing (Teacher) ---
  const startScreenShare = async () => {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
    });
    localStream.current = stream;
    setIsSharing(true);

    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }

    // Notify server (optional)
    socket.emit("start-screen-share", { sessionId });
  };

  return (
    <div className="p-4 border rounded shadow bg-white">
      <h3 className="font-bold mb-2 text-center">Screen Sharing</h3>

      {role === "teacher" && !isSharing && (
        <button
          onClick={startScreenShare}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Start Screen Sharing
        </button>
      )}

      <video
        ref={videoRef}
        className="w-full mt-4 bg-black"
        autoPlay
        playsInline
        muted={role === "teacher"}
      />

      {role === "student" && !videoRef.current?.srcObject && (
        <p className="text-gray-500 text-center mt-4">
          Waiting for teacher to share screen...
        </p>
      )}
    </div>
  );
};

export default ScreenShareComponent;
