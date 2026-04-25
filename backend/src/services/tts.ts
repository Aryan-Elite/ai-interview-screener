import OpenAI from "openai";

const getClient = () => new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function synthesizeSpeech(text: string): Promise<string> {
  const response = await getClient().audio.speech.create({
    model: process.env.OPENAI_MODEL_TTS!,
    voice: "alloy",
    input: text,
    response_format: "mp3",
  });

  const buffer = Buffer.from(await response.arrayBuffer());
  return buffer.toString("base64");
}
