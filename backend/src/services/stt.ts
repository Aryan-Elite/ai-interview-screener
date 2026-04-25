import { createSpeechmaticsJWT } from "@speechmatics/auth";

export async function getSpeechmaticsToken(): Promise<string> {
  return createSpeechmaticsJWT({
    type: "rt",
    apiKey: process.env.SPEECHMATICS_API_KEY!,
    ttl: 60,
  });
}
