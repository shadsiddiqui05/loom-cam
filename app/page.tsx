// app/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Peer from "peerjs";

// --- COMPONENTS ---

// 1. The Monitor (Run this on your PC/Loom computer)
const Monitor = () => {
  const [peerId, setPeerId] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Generate a simple random ID for the phone to connect to
    const myId = "loom-monitor-" + Math.floor(Math.random() * 10000);
    const peer = new Peer(myId);

    peer.on("open", (id) => {
      setPeerId(id);
    });

    peer.on("call", (call) => {
      // Answer the call automatically
      call.answer();
      call.on("stream", (remoteStream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = remoteStream;
        }
      });
    });

    return () => peer.destroy();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-black text-white">
      {/* Helper Text (Hidden once video starts effectively) */}
      <div className="absolute top-4 left-4 z-10 bg-gray-900 p-4 rounded-lg opacity-80 hover:opacity-100 transition">
        <h2 className="text-xl font-bold text-blue-400">PC Receiver</h2>
        <p className="mt-2">ID to enter on phone: <span className="font-mono text-yellow-300 text-xl font-bold select-all">{peerId || "Generating..."}</span></p>
        <p className="text-xs text-gray-400 mt-2">Open OBS -> Window Capture -> This Chrome Tab -> Start Virtual Cam</p>
      </div>
      
      {/* Video Display */}
      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
    </div>
  );
};

// 2. The Camera (Run this on your Phone)
const Camera = () => {
  const [targetId, setTargetId] = useState("");
  const [status, setStatus] = useState("Idle");
  const videoRef = useRef<HTMLVideoElement>(null);

  const startStream = async () => {
    setStatus("Accessing Camera...");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: 1280, height: 720 }, // Back camera, HD
        audio: true, // Send audio too if needed
      });

      // Show local preview
      if (videoRef.current) videoRef.current.srcObject = stream;

      setStatus(`Connecting to ${targetId}...`);
      const peer = new Peer();
      
      peer.on("open", () => {
        const call = peer.call(targetId, stream);
        call.on("close", () => setStatus("Call Ended"));
        setStatus("Streaming Live!");
      });

      peer.on("error", (err) => setStatus("Error: " + err.message));

    } catch (err) {
      console.error(err);
      setStatus("Camera Error (Check Permissions/HTTPS)");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white p-4">
      <h2 className="text-2xl font-bold mb-6 text-green-400">Phone Camera</h2>
      
      <div className="w-full max-w-md space-y-4">
        <input
          type="text"
          placeholder="Enter PC ID (e.g., loom-monitor-1234)"
          className="w-full p-3 rounded bg-gray-800 border border-gray-700 text-white focus:border-green-500 outline-none"
          onChange={(e) => setTargetId(e.target.value)}
        />
        
        <button
          onClick={startStream}
          className="w-full py-4 bg-green-600 hover:bg-green-500 rounded font-bold text-lg shadow-lg transition"
        >
          Start Streaming
        </button>

        <p className="text-center text-sm text-gray-400 mt-4">Status: <span className="text-white">{status}</span></p>
      </div>

      {/* Local Preview (Hidden mostly to save battery/screen, or small) */}
      <video ref={videoRef} muted autoPlay playsInline className="mt-8 w-32 h-32 rounded-lg border border-gray-600 object-cover opacity-50" />
    </div>
  );
};

// 3. Main Entry Point
export default function Home() {
  const [mode, setMode] = useState<"select" | "camera" | "monitor">("select");

  if (mode === "camera") return <Camera />;
  if (mode === "monitor") return <Monitor />;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-black text-white p-6">
      <h1 className="text-4xl font-extrabold mb-8 tracking-tight">LoomCam Bridge</h1>
      <div className="grid gap-6 w-full max-w-lg">
        <button 
          onClick={() => setMode("camera")}
          className="p-8 bg-gray-800 rounded-xl hover:bg-gray-700 transition border border-gray-700 flex flex-col items-center"
        >
          <span className="text-2xl mb-2">📸 I am the Phone</span>
          <span className="text-gray-400">Use this device as the camera</span>
        </button>

        <button 
          onClick={() => setMode("monitor")}
          className="p-8 bg-gray-800 rounded-xl hover:bg-gray-700 transition border border-gray-700 flex flex-col items-center"
        >
          <span className="text-2xl mb-2">💻 I am the PC (Loom)</span>
          <span className="text-gray-400">Receive video on this screen</span>
        </button>
      </div>
    </main>
  );
}