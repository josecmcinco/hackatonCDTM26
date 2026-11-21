/**
 * Simulated Voice Adapter for Talent Intelligence by NTT DATA
 * 
 * NOTE: Fully working simulated voice pipeline with observable UI states:
 * - idle
 * - listening (live visible transcript simulation)
 * - processing (shimmer thinking state)
 * - speaking (progress bar and mocked voice readout)
 * 
 * NO external SDKs, NO real microphone access, NO network calls.
 */

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';

export interface VoiceAdapter {
  startListening: (onTranscriptUpdate: (text: string) => void) => Promise<void>;
  stopListening: () => Promise<string>;
  speak: (text: string, onProgress?: (pct: number) => void) => Promise<void>;
  cancelSpeaking: () => void;
}

export class MockVoiceAdapter implements VoiceAdapter {
  private isListening = false;
  private isSpeaking = false;
  private timer: NodeJS.Timeout | null = null;
  private speechTimer: NodeJS.Timeout | null = null;

  async startListening(onTranscriptUpdate: (text: string) => void): Promise<void> {
    this.isListening = true;
    const mockPhrases = [
      "Buscando...",
      "Necesito 4 personas para un proyecto SAP en banca...",
      "Necesito 4 personas para un proyecto SAP en banca, empiezan en enero y disponibilidad inmediata."
    ];

    let step = 0;
    this.timer = setInterval(() => {
      if (!this.isListening) {
        if (this.timer) clearInterval(this.timer);
        return;
      }
      if (step < mockPhrases.length) {
        onTranscriptUpdate(mockPhrases[step]);
        step++;
      }
    }, 900);

    // TODO: [ElevenLabs Integration]
    // Replace simulation with ElevenLabs Conversational AI WebSocket Client:
    // const conversation = await Conversation.startSession({
    //   agentId: process.env.VITE_ELEVENLABS_AGENT_ID,
    //   onMessage: ({ message }) => onTranscriptUpdate(message),
    // });
  }

  async stopListening(): Promise<string> {
    this.isListening = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    return "Necesito 4 personas para un proyecto SAP en banca, empiezan en enero y disponibilidad inmediata.";

    // TODO: [ElevenLabs Integration]
    // await conversation.endSession();
  }

  async speak(text: string, onProgress?: (pct: number) => void): Promise<void> {
    this.isSpeaking = true;
    const duration = Math.min(8000, Math.max(3000, text.length * 40));
    const interval = 100;
    let elapsed = 0;

    return new Promise((resolve) => {
      this.speechTimer = setInterval(() => {
        if (!this.isSpeaking) {
          if (this.speechTimer) clearInterval(this.speechTimer);
          resolve();
          return;
        }
        elapsed += interval;
        const progress = Math.min(100, Math.round((elapsed / duration) * 100));
        if (onProgress) onProgress(progress);

        if (elapsed >= duration) {
          if (this.speechTimer) clearInterval(this.speechTimer);
          this.isSpeaking = false;
          resolve();
        }
      }, interval);
    });

    // TODO: [ElevenLabs Integration]
    // Call ElevenLabs TTS endpoint:
    // const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, ...);
    // const audioBlob = await response.blob();
    // const audio = new Audio(URL.createObjectURL(audioBlob));
    // audio.play();
  }

  cancelSpeaking(): void {
    this.isSpeaking = false;
    if (this.speechTimer) {
      clearInterval(this.speechTimer);
      this.speechTimer = null;
    }
  }
}

export const defaultVoiceAdapter = new MockVoiceAdapter();
