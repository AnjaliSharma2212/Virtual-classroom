import { useEffect, useRef, useState } from "react";
import socket from "../services/socket";
import { Video, VideoOff, MicOff, Mic, HandMetal } from "lucide-react";

const ICE_SERVERS = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

interface RemoteStream {
  id: string;
  stream: MediaStream;
  name: string;
  raisedHand: boolean;
  speaking: boolean;
  muted: boolean;
}

interface Props {
  sessionId: string;
}

const MultiUserVideoGrid: React.FC<Props> = ({ sessionId }) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [remoteStreams, setRemoteStreams] = useState<RemoteStream[]>([]);
  const peerConnections = useRef<Record<string, RTCPeerConnection>>({});
  const localStream = useRef<MediaStream | null>(null);

  const [audioOn, setAudioOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [handRaised, setHandRaised] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const userName = "You"; // Replace with actual user name (from props/context/state)
  const userId = socket.id;

  const toggleAudio = () => {
    if (localStream.current) {
      localStream.current.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setAudioOn((prev) => !prev);
    }
  };

  const toggleVideo = () => {
    if (!localStream.current) return;

    const videoTracks = localStream.current.getVideoTracks();

    if (videoOn) {
      videoTracks.forEach((track) => {
        track.stop();
        localStream.current?.removeTrack(track);
      });

      Object.values(peerConnections.current).forEach((pc) => {
        pc.getSenders().forEach((sender) => {
          if (sender.track?.kind === "video") {
            pc.removeTrack(sender);
          }
        });
      });

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
    } else {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((newStream) => {
          const videoTrack = newStream.getVideoTracks()[0];
          localStream.current?.addTrack(videoTrack);

          if (localVideoRef.current) {
            const newLocalStream = new MediaStream([videoTrack]);
            localVideoRef.current.srcObject = newLocalStream;
            localVideoRef.current.play();
          }

          Object.values(peerConnections.current).forEach((pc) => {
            pc.addTrack(videoTrack, localStream.current!);
          });
        })
        .catch(() => {
          console.error("Failed to re-enable camera.");
        });
    }

    setVideoOn((prev) => !prev);
  };

  const toggleRaiseHand = () => {
    const newState = !handRaised;
    setHandRaised(newState);
    socket.emit("raise-hand", { sessionId, raised: newState });
  };

  useEffect(() => {
    if (!localStream.current) return;

    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(localStream.current);
    const analyser = audioContext.createAnalyser();
    source.connect(analyser);
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const detectSpeaking = () => {
      analyser.getByteFrequencyData(dataArray);
      const volume = dataArray.reduce((a, b) => a + b) / dataArray.length;
      setIsSpeaking(volume > 30);
      requestAnimationFrame(detectSpeaking);
    };

    detectSpeaking();

    return () => {
      audioContext.close().catch(() => {});
    };
  }, [localStream.current]);

  useEffect(() => {
    socket.emit("join-room", { sessionId, userId, name: userName });

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        localStream.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.onloadedmetadata = () => {
            localVideoRef.current?.play();
          };
        }

        socket.on(
          "user-joined",
          ({ userId, name, sessionId: incomingSession }) => {
            if (incomingSession !== sessionId) return;
            const pc = createPeerConnection(userId, name);
            localStream.current?.getTracks().forEach((track) => {
              pc.addTrack(track, localStream.current!);
            });
            pc.createOffer().then((offer) => {
              pc.setLocalDescription(offer);
              socket.emit("offer", { to: userId, sessionId, offer });
            });
          }
        );

        socket.on("raise-hand", ({ userId, raised }) => {
          setRemoteStreams((prev) =>
            prev.map((s) =>
              s.id === userId ? { ...s, raisedHand: raised } : s
            )
          );
        });

        socket.on(
          "offer",
          async ({ from, sessionId: incomingSession, offer }) => {
            if (incomingSession !== sessionId) return;
            const pc = createPeerConnection(from, "Participant");
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            localStream.current?.getTracks().forEach((track) => {
              pc.addTrack(track, localStream.current!);
            });
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit("answer", { to: from, sessionId, answer });
          }
        );

        socket.on(
          "answer",
          async ({ from, sessionId: incomingSession, answer }) => {
            if (incomingSession !== sessionId) return;
            const pc = peerConnections.current[from];
            if (pc) {
              await pc.setRemoteDescription(new RTCSessionDescription(answer));
            }
          }
        );

        socket.on(
          "ice-candidate",
          ({ from, sessionId: incomingSession, candidate }) => {
            if (incomingSession !== sessionId) return;
            const pc = peerConnections.current[from];
            if (pc && candidate) {
              pc.addIceCandidate(new RTCIceCandidate(candidate));
            }
          }
        );

        socket.on("user-left", ({ userId, sessionId: incomingSession }) => {
          if (incomingSession !== sessionId) return;
          if (peerConnections.current[userId]) {
            peerConnections.current[userId].close();
            delete peerConnections.current[userId];
            setRemoteStreams((prev) => prev.filter((s) => s.id !== userId));
          }
        });
      });

    return () => {
      socket.emit("leave-room", { sessionId });
      Object.values(peerConnections.current).forEach((pc) => pc.close());
      peerConnections.current = {};
    };
  }, [sessionId]);

  const createPeerConnection = (userId: string, userName: string) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", {
          to: userId,
          sessionId,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      const newStream = new MediaStream();
      event.streams[0].getTracks().forEach((track) => {
        newStream.addTrack(track);
      });

      setRemoteStreams((prev) => [
        ...prev.filter((s) => s.id !== userId),
        {
          id: userId,
          stream: newStream,
          name: userName || "Participant",
          raisedHand: false,
          speaking: false,
          muted: false,
        },
      ]);
    };

    peerConnections.current[userId] = pc;
    return pc;
  };

  return (
    <div className="p-4">
      <div
        className={`grid ${
          remoteStreams.length + 1 >= 4 ? "grid-cols-3" : "grid-cols-2"
        } gap-4`}
      >
        {/* Local Video */}
        <div className="relative">
          <video
            ref={localVideoRef}
            muted
            autoPlay
            playsInline
            className={`rounded-lg border-4 transition ${
              isSpeaking ? "border-green-500" : "border-gray-400"
            } bg-black h-48 w-full object-cover`}
          />

          {handRaised && (
            <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs">
              ✋ You Raised Hand
            </div>
          )}

          <p className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
            {userName}
          </p>

          <div className="flex justify-center mt-2 space-x-2">
            <button
              onClick={toggleAudio}
              className={`rounded-full p-2 ${
                audioOn ? "bg-green-600" : "bg-red-600"
              } hover:scale-110 transition`}
              title={audioOn ? "Mute Microphone" : "Unmute Microphone"}
            >
              {audioOn ? (
                <Mic size={18} color="white" />
              ) : (
                <MicOff size={18} color="white" />
              )}
            </button>
            <button
              onClick={toggleVideo}
              className={`rounded-full p-2 ${
                videoOn ? "bg-green-600" : "bg-red-600"
              } hover:scale-110 transition`}
              title={videoOn ? "Turn Off Camera" : "Turn On Camera"}
            >
              {videoOn ? (
                <Video size={18} color="white" />
              ) : (
                <VideoOff size={18} color="white" />
              )}
            </button>
            <button
              onClick={toggleRaiseHand}
              className={`rounded-full p-2 ${
                handRaised ? "bg-yellow-500" : "bg-gray-500"
              } hover:scale-110 transition`}
              title={handRaised ? "Lower Hand" : "Raise Hand"}
            >
              <HandMetal size={18} color="white" />
            </button>
          </div>
        </div>

        {/* Remote Participants */}
        {remoteStreams.map(({ id, stream, name, raisedHand, muted }) => (
          <div key={id} className="relative">
            <video
              autoPlay
              playsInline
              className="rounded-lg border-4 border-gray-400 bg-black h-48 w-full object-cover"
              ref={(video) => {
                if (video) {
                  video.srcObject = stream;
                }
              }}
            />

            {raisedHand && (
              <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs">
                ✋ Raised Hand
              </div>
            )}

            {muted && (
              <div className="absolute bottom-2 right-2 bg-red-600 text-white px-2 py-1 rounded-full text-xs">
                Muted
              </div>
            )}

            <p className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
              {name || "Participant"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MultiUserVideoGrid;
