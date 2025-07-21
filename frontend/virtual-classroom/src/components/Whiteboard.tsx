import React, { useEffect, useRef, useState } from "react";
import socket from "../services/socket";
import { Eraser, Pen } from "lucide-react";

interface Props {
  sessionId: string;
}

const Whiteboard: React.FC<Props> = ({ sessionId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [color, setColor] = useState<string>("#000000");
  const [lineWidth, setLineWidth] = useState<number>(2);
  const [isEraser, setIsEraser] = useState<boolean>(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    const draw = (x: number, y: number, color: string, lw: number) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = lw;
      ctx.lineTo(x, y);
      ctx.stroke();
    };

    let drawing = false;

    const handleMouseDown = (e: MouseEvent) => {
      drawing = true;
      ctx.beginPath();
      ctx.moveTo(e.offsetX, e.offsetY);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!drawing) return;
      const drawColor = isEraser ? "#ffffff" : color;
      draw(e.offsetX, e.offsetY, drawColor, lineWidth);

      socket.emit("whiteboard-draw", {
        sessionId,
        drawData: {
          x: e.offsetX,
          y: e.offsetY,
          color: drawColor,
          lineWidth,
        },
      });
    };

    const handleMouseUp = () => {
      drawing = false;
      ctx.beginPath();
    };

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);

    socket.on(
      "whiteboard-draw",
      ({ sessionId: incomingSessionId, drawData }) => {
        if (incomingSessionId !== sessionId) return;
        draw(drawData.x, drawData.y, drawData.color, drawData.lineWidth);
      }
    );

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseup", handleMouseUp);
      socket.off("whiteboard-draw");
    };
  }, [color, lineWidth, isEraser, sessionId]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      socket.emit("whiteboard-clear", { sessionId });
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    socket.on("whiteboard-clear", ({ sessionId: incomingSessionId }) => {
      if (incomingSessionId !== sessionId) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    return () => {
      socket.off("whiteboard-clear");
    };
  }, [sessionId]);

  return (
    <div className="border p-2 bg-white rounded">
      <div className="flex space-x-2 mb-2">
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          disabled={isEraser}
        />
        <input
          type="range"
          min={1}
          max={10}
          value={lineWidth}
          onChange={(e) => setLineWidth(Number(e.target.value))}
        />
        <button
          onClick={() => setIsEraser(false)}
          className={!isEraser ? "font-bold" : ""}
        >
          <Pen size={20} />
        </button>
        <button
          onClick={() => setIsEraser(true)}
          className={isEraser ? "font-bold" : ""}
        >
          <Eraser size={20} />
        </button>
        <button onClick={clearCanvas} className="text-red-500">
          Clear
        </button>
      </div>
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="border bg-white"
      />
    </div>
  );
};

export default Whiteboard;
