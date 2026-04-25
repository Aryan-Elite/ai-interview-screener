export async function startSpeechmaticsSTT(
  onPartial: (text: string) => void,
  onFinal: (text: string) => void,
  token: string,
  deviceId?: string
): Promise<() => void> {
  const ws = new WebSocket(`wss://eu2.rt.speechmatics.com/v2?jwt=${token}`);

  ws.onopen = async () => {
    ws.send(JSON.stringify({
      message: "StartRecognition",
      audio_format: { type: "raw", encoding: "pcm_s16le", sample_rate: 16000 },
      transcription_config: { language: "en", max_delay: 0.7 },
    }));
    await startMic(ws, deviceId);
  };

  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (msg.message === "AddPartialTranscript") onPartial(msg.metadata?.transcript ?? "");
    if (msg.message === "AddTranscript") {
      const text = (msg.metadata?.transcript ?? "").trim();
      if (text) onFinal(text);
    }
  };

  ws.onerror = (e) => console.error("Speechmatics WS error", e);

  return () => ws.close();
}

async function startMic(ws: WebSocket, deviceId?: string) {
  const audio = deviceId ? { deviceId: { exact: deviceId } } : true;
  const stream = await navigator.mediaDevices.getUserMedia({ audio });
  const ctx = new AudioContext({ sampleRate: 16000 });
  const source = ctx.createMediaStreamSource(stream);
  const proc = ctx.createScriptProcessor(4096, 1, 1);
  proc.onaudioprocess = (e: AudioProcessingEvent) => {
    if (ws.readyState !== WebSocket.OPEN) return;
    const float32 = e.inputBuffer.getChannelData(0);
    const int16 = new Int16Array(float32.length);
    for (let i = 0; i < float32.length; i++) {
      int16[i] = Math.max(-32768, Math.min(32767, float32[i] * 32768));
    }
    ws.send(int16.buffer);
  };
  source.connect(proc);
  proc.connect(ctx.destination);
}
