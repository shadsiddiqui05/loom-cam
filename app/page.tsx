"use client";

import { useEffect, useRef, useState } from "react";

// 1. The Monitor (PC Receiver)
const Monitor = () => {
  const [peerId, setPeerId] = useState("");
  const videoRef = useRef<any>(null); 

  useEffect(() => {
    const initPeer = async () => {
      const { default: Peer } = await import("peerjs");
      const myId = "loom-monitor-" + Math.floor(Math.random() * 10000);
      const peer = new Peer(myId);

      peer.on("open", (id: string) => {
        setPeerId(id);
      });

      peer.on("call", (call: any) => {
        call.answer(); 
        call.on("stream", (remoteStream: any) => {
          if (videoRef.current) {
            videoRef.current.srcObject = remoteStream;
          }
        });
      });
    };

    initPeer();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-black text-white">
      <div className="absolute top-4 left-4 z-10 bg-gray-900 p-4 rounded-lg opacity-80 hover:opacity-100 transition">
        <h2 className="text-xl font-bold text-blue-400">PC Receiver</h2>
        <p className="mt-2">ID: <span className="font-mono text-yellow-300 text-xl font-bold select-all">{peerId || "Generating..."}</span></p>
        
        {/* FIXED LINE BELOW */}
        <p className="text-xs text-gray-400 mt-2">Open OBS &rarr; Window Capture &rarr; This Chrome Tab</p>
      
      </div>
      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
    </div>
  );
};

// 2. The Camera (Phone Sender)
const Camera = () => {
  const [targetId, setTargetId] = useState("");
  const [status, setStatus] = useState("Idle");
  const videoRef = useRef<any>(null);

  const startStream = async () => {
    setStatus("Accessing Camera...");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: 1280, height: 720 },
        audio: true,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setStatus(`Connecting to ${targetId}...`);
      const { default: Peer } = await import("peerjs");
      const peer = new Peer();
      
      peer.on("open", () => {
        // @ts-ignore
        const call = peer.call(targetId, stream);
        call.on("close", () => setStatus("Call Ended"));
        call.on("error", (err: any) => setStatus("Call Error: " + err));
        setStatus("Streaming Live!");
      });

      peer.on("error", (err: any) => setStatus("Connection Error: " + err.message));

    } catch (err: any) {
      console.error(err);
      setStatus("Error: " + (err.message || "Camera blocked"));
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white p-4">
      <h2 className="text-2xl font-bold mb-6 text-green-400">Phone Camera</h2>
      <div className="w-full max-w-md space-y-4">
        <input
          type="text"
          placeholder="Enter PC ID"
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
      <video ref={videoRef} muted autoPlay playsInline className="mt-8 w-32 h-32 rounded-lg border border-gray-600 object-cover opacity-50" />
    </div>
  );
};

export default function Home() {
  const [mode, setMode] = useState("select");

  if (mode === "camera") return <Camera />;
  if (mode === "monitor") return <Monitor />;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-950 text-white p-6">
      <h1 className="text-4xl font-extrabold mb-8">LoomCam Bridge</h1>
      <div className="grid gap-6 w-full max-w-lg">
        <button onClick={() => setMode("camera")} className="p-8 bg-gray-800 rounded-xl hover:bg-gray-700 border border-gray-700">
          <span className="text-2xl block mb-2">📸 Phone Mode</span>
        </button>
        <button onClick={() => setMode("monitor")} className="p-8 bg-gray-800 rounded-xl hover:bg-gray-700 border border-gray-700">
          <span className="text-2xl block mb-2">💻 PC Mode</span>
        </button>
      </div>
    </main>
  );
}
