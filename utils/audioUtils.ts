
/**
 * Decodes a base64 string into a Uint8Array.
 * @param base64 The base64 encoded string.
 * @returns A Uint8Array containing the decoded bytes.
 */
export function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Decodes raw PCM audio data into an AudioBuffer for playback.
 * The Gemini TTS API returns raw PCM data, not a standard audio file format.
 * @param data The raw audio data as a Uint8Array.
 * @param ctx The AudioContext to use for creating the buffer.
 * @param sampleRate The sample rate of the audio (Gemini TTS is 24000).
 * @param numChannels The number of audio channels (Gemini TTS is mono, so 1).
 * @returns A promise that resolves with an AudioBuffer.
 */
export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  // The API returns 16-bit PCM, so we need to view the buffer as Int16.
  const dataInt16 = new Int16Array(data.buffer);
  
  // Calculate the number of frames.
  const frameCount = dataInt16.length / numChannels;

  // Create an empty AudioBuffer.
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  // Fill the buffer with the PCM data.
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      // Convert the 16-bit integer sample to a 32-bit float sample in the range [-1, 1].
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  
  return buffer;
}
