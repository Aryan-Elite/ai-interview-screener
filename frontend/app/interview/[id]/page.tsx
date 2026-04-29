"use client";
import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { sendChat, generateAssessment, getSttToken } from "@/lib/api";
import { startSpeechmaticsSTT } from "@/lib/stt/speechmatics";

type Phase = "start" | "setup" | "listening" | "thinking" | "done";
type MicStatus = "idle" | "detecting" | "voice_detected" | "ok" | "error";

function playBase64Audio(base64: string): Promise<void> {
  return new Promise((resolve) => {
    const bytes = atob(base64);
    const arr = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
    const audio = new Audio(URL.createObjectURL(new Blob([arr], { type: "audio/mp3" })));
    audio.onended = () => resolve();
    audio.onerror = () => resolve();
    audio.play().catch(() => resolve());
  });
}

export default function InterviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("start");
  const [question, setQuestion] = useState("Loading...");
  const [liveText, setLiveText] = useState("");
  const [timeLeft, setTimeLeft] = useState(360);
  const [statusMsg, setStatusMsg] = useState("Click 'Begin' to start your interview");
  const [candidateName, setCandidateName] = useState("");

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [micStatus, setMicStatus] = useState<MicStatus>("idle");
  const [audioLevel, setAudioLevel] = useState(0);

  const tabSwitches = useRef<{ timestamp: number; timeElapsed: number }[]>([]);
  const [showWarning, setShowWarning] = useState(false);

  const elapsed = useRef(0);
  const accumulated = useRef("");
  const silenceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stopSttRef = useRef<(() => void) | null>(null);
  const phaseRef = useRef<Phase>("start");
  const endedRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const testStreamRef = useRef<MediaStream | null>(null);
  const testCtxRef = useRef<AudioContext | null>(null);

  function updatePhase(p: Phase) { phaseRef.current = p; setPhase(p); }

  function stopVoiceTest() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    testStreamRef.current?.getTracks().forEach(t => t.stop());
    testCtxRef.current?.close();
    rafRef.current = null;
    testStreamRef.current = null;
    testCtxRef.current = null;
  }

  async function openSetup() {
    const stored = sessionStorage.getItem(`iv_${id}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.candidateName) setCandidateName(parsed.candidateName);
    }
    try {
      // get permission first so enumerateDevices returns proper labels
      const perm = await navigator.mediaDevices.getUserMedia({ audio: true });
      perm.getTracks().forEach(t => t.stop());
    } catch {
      // permission denied — still show setup screen with whatever labels we can get
    }
    const all = await navigator.mediaDevices.enumerateDevices();
    const inputs = all.filter(d => d.kind === "audioinput" && !d.label.toLowerCase().startsWith("monitor of"));
    setDevices(inputs);
    setSelectedDeviceId(inputs[0]?.deviceId ?? "");
    updatePhase("setup");
  }

  async function startVoiceTest() {
    stopVoiceTest();
    setMicStatus("detecting");
    setAudioLevel(0);

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: selectedDeviceId ? { deviceId: { exact: selectedDeviceId } } : true,
      });
    } catch {
      setMicStatus("error");
      return;
    }

    testStreamRef.current = stream;
    const ctx = new AudioContext();
    testCtxRef.current = ctx;
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    let voiceFrames = 0;
    let silenceFrames = 0;
    let hadVoice = false;

    function tick() {
      analyser.getByteFrequencyData(dataArray);
      const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      const level = Math.min(100, (avg / 128) * 100);
      setAudioLevel(level);

      const isSpeaking = avg > 20;

      if (isSpeaking) {
        voiceFrames++;
        silenceFrames = 0;
        if (voiceFrames > 8) hadVoice = true;
        if (hadVoice) setMicStatus("voice_detected");
      } else {
        silenceFrames++;
        if (hadVoice && silenceFrames > 20) {
          // voice was detected and now silent — proceed
          stopVoiceTest();
          setMicStatus("ok");
          setAudioLevel(0);
          return;
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    tick();
  }

  function endInterview() {
    if (endedRef.current) return;
    endedRef.current = true;
    updatePhase("done");
    stopSttRef.current?.();
    generateAssessment(id, tabSwitches.current);
    router.push(`/report/${id}`);
  }

  function clearSttBuffer() {
    if (silenceTimer.current) clearTimeout(silenceTimer.current);
    accumulated.current = "";
    setLiveText("");
  }

  async function sendTurn() {
    if (phaseRef.current !== "listening") return;
    const text = accumulated.current.trim();
    if (!text) return;
    clearSttBuffer();
    updatePhase("thinking");
    setStatusMsg("AI is thinking...");

    const res = await sendChat(id, text, elapsed.current);
    if (!res.success) { updatePhase("listening"); setStatusMsg("Listening..."); return; }

    const { reply, audio, isClosing } = res.data;
    setQuestion(reply);
    setStatusMsg(isClosing ? "Wrapping up your session..." : "AI is speaking...");
    clearSttBuffer();
    await playBase64Audio(audio);
    clearSttBuffer();

    if (isClosing || endedRef.current) { endInterview(); return; }
    updatePhase("listening");
    setStatusMsg("Listening...");
  }

  function scheduleSend() {
    if (phaseRef.current !== "listening") return;
    if (silenceTimer.current) clearTimeout(silenceTimer.current);
    silenceTimer.current = setTimeout(sendTurn, 2000);
  }

  async function begin() {
    const stored = sessionStorage.getItem(`iv_${id}`);
    if (!stored) { router.push("/"); return; }
    const { firstQuestion, audio, candidateName: name } = JSON.parse(stored);
    if (name) setCandidateName(name);
    sessionStorage.removeItem(`iv_${id}`);

    setQuestion(firstQuestion);
    updatePhase("thinking");
    setStatusMsg("AI is speaking...");
    await playBase64Audio(audio);
    updatePhase("listening");
    setStatusMsg("Listening...");

    const onPartial = (text: string) => {
      if (phaseRef.current === "listening") setLiveText(text);
    };
    const onFinal = (text: string) => {
      if (phaseRef.current !== "listening") return;
      accumulated.current += " " + text;
      setLiveText("");
      scheduleSend();
    };

    const token = await getSttToken();
    stopSttRef.current = await startSpeechmaticsSTT(onPartial, onFinal, token, selectedDeviceId || undefined);

    setInterval(() => {
      elapsed.current += 1;
      setTimeLeft(t => Math.max(0, t - 1));
    }, 1000);
  }

  useEffect(() => {
    return () => {
      stopSttRef.current?.();
      stopVoiceTest();
    };
  }, []);

  useEffect(() => {
    function handleVisibility() {
      if (!document.hidden) return;
      tabSwitches.current.push({ timestamp: Date.now(), timeElapsed: 360 - timeLeft });
      setShowWarning(true);
      setTimeout(() => setShowWarning(false), 4000);
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [timeLeft]);

  const mins = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const secs = String(timeLeft % 60).padStart(2, "0");
  const timerColor = timeLeft < 60 ? "text-red-400" : "text-[#f0f6fc]";

  return (
    <div className="min-h-screen flex flex-col">
      {showWarning && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-amber-900/90 border border-amber-600 text-amber-200 px-5 py-3 rounded-xl text-sm font-medium shadow-lg">
          ⚠ Warning: Leaving the interview tab may be flagged for review
        </div>
      )}
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#30363d]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">C</div>
          <span className="text-[#8b949e] text-sm">Cuemath AI Screener</span>
        </div>
        <span className={`text-xl font-mono font-semibold ${timerColor}`}>{mins}:{secs}</span>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 gap-6 max-w-2xl mx-auto w-full">

        {/* Mic setup screen */}
        {phase === "setup" && (
          <div className="w-full bg-[#161b22] border border-[#30363d] rounded-xl p-6 flex flex-col gap-5">
            <div>
              <p className="text-[#f0f6fc] font-medium mb-1">
                {candidateName ? `Hi ${candidateName}, set up your microphone` : "Set up your microphone"}
              </p>
              <p className="text-[#8b949e] text-sm">Speak clearly and naturally. The AI interviewer will evaluate your English communication skills.</p>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[#8b949e] text-xs uppercase tracking-wider">Input device</label>
              <select
                value={selectedDeviceId}
                onChange={e => { setSelectedDeviceId(e.target.value); setMicStatus("idle"); stopVoiceTest(); setAudioLevel(0); }}
                className="w-full bg-[#0d1117] border border-[#30363d] text-[#f0f6fc] rounded-lg px-3 py-2 text-sm"
              >
                {devices.map(d => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label || `Microphone ${d.deviceId.slice(0, 8)}`}
                  </option>
                ))}
              </select>
            </div>

            {micStatus === "idle" && (
              <button
                onClick={startVoiceTest}
                className="px-4 py-2 bg-[#21262d] hover:bg-[#30363d] text-[#f0f6fc] text-sm font-medium rounded-lg transition-colors w-fit"
              >
                Test microphone
              </button>
            )}

            {(micStatus === "detecting" || micStatus === "voice_detected") && (
              <div className="flex flex-col gap-3">
                <p className="text-[#f0f6fc] text-sm">
                  {micStatus === "detecting"
                    ? "Say: \"I am ready to start the interview\""
                    : "Voice detected — finish speaking..."}
                </p>
                <div className="w-full h-3 bg-[#0d1117] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-75"
                    style={{
                      width: `${audioLevel}%`,
                      backgroundColor: micStatus === "voice_detected" ? "#22c55e" : "#6366f1",
                    }}
                  />
                </div>
              </div>
            )}

            {micStatus === "ok" && (
              <div className="flex flex-col gap-3">
                <p className="text-green-400 text-sm">Microphone verified ✓</p>
                <button
                  onClick={begin}
                  className="w-full px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-colors"
                >
                  Start Interview
                </button>
              </div>
            )}

            {micStatus === "error" && (
              <div className="flex flex-col gap-2">
                <p className="text-red-400 text-sm">Could not access microphone — check browser permissions and try again.</p>
                <button
                  onClick={() => { setMicStatus("idle"); }}
                  className="text-[#8b949e] text-sm underline w-fit"
                >
                  Try again
                </button>
              </div>
            )}
          </div>
        )}

        {/* AI question — shown during interview */}
        {phase !== "start" && phase !== "setup" && (
          <div className="w-full bg-[#161b22] border border-[#30363d] rounded-xl p-5">
            <p className="text-xs font-medium text-[#8b949e] uppercase tracking-wider mb-2">AI Interviewer</p>
            <p className="text-[#f0f6fc] text-base leading-relaxed">{question}</p>
          </div>
        )}

        {/* Pre-interview instructions */}
        {phase === "start" && (
          <div className="w-full space-y-3">
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
              <p className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-3">What to Expect</p>
              <ul className="space-y-2">
                {["A 6-minute voice conversation with an AI interviewer", "Questions about your teaching experience and approach", "The AI will follow up naturally based on your answers", "Your responses are evaluated on communication, warmth, and clarity"].map(item => (
                  <li key={item} className="flex gap-2.5 text-sm text-[#f0f6fc]">
                    <span className="text-indigo-400 mt-0.5">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
              <p className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-3">Best Practices</p>
              <ul className="space-y-2">
                {["Find a quiet environment with no background noise", "Use headphones for best audio quality", "Speak clearly and at a natural pace", "Allow microphone access when prompted"].map(item => (
                  <li key={item} className="flex gap-2.5 text-sm text-[#f0f6fc]">
                    <span className="text-indigo-400 mt-0.5">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Mic / status */}
        <div className="flex flex-col items-center gap-3">
          {phase === "start" && (
            <button
              onClick={openSetup}
              className="w-full px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-colors"
            >
              Begin Interview
            </button>
          )}
          {phase !== "start" && phase !== "setup" && (
            <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 transition-colors ${
              phase === "listening" ? "border-indigo-500 bg-indigo-500/10 animate-pulse" :
              "border-[#30363d] bg-[#161b22]"
            }`}>
              <svg className="w-7 h-7 text-[#f0f6fc]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm-1 18.94V22h2v-2.06A8 8 0 0 0 20 12h-2a6 6 0 0 1-12 0H4a8 8 0 0 0 7 7.94z"/>
              </svg>
            </div>
          )}
          {phase !== "setup" && <p className="text-[#8b949e] text-sm">{statusMsg}</p>}
        </div>

        {/* Live transcript */}
        {liveText && (
          <div className="w-full bg-[#161b22] border border-[#30363d] rounded-xl px-4 py-3">
            <p className="text-xs font-medium text-[#8b949e] uppercase tracking-wider mb-1">You (live)</p>
            <p className="text-[#f0f6fc] text-sm italic">{liveText}</p>
          </div>
        )}
      </div>
    </div>
  );
}
