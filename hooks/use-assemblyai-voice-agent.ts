'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
export function useAssemblyAIVoiceAgent({
  onTranscript,
}: {
  onTranscript: (text: string) => void;
}) {
  const [state, setState] = useState<
    'idle' | 'connecting' | 'listening' | 'error'
  >('idle');
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const socket = useRef<WebSocket | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const context = useRef<AudioContext | null>(null);
  const cleanup = useCallback(() => {
    stream.current?.getTracks().forEach((track) => track.stop());
    if (context.current?.state !== 'closed') void context.current?.close();
    socket.current?.close();
    socket.current = null;
    stream.current = null;
    context.current = null;
    setPreview('');
    setState('idle');
  }, []);
  const start = useCallback(async () => {
    try {
      setError('');
      setState('connecting');
      const tokenResponse = await fetch('/api/assemblyai/voice-token', {
        cache: 'no-store',
      });
      const data = (await tokenResponse.json()) as {
        token?: string;
        agentId?: string;
        error?: string;
      };
      if (!tokenResponse.ok || !data.token || !data.agentId)
        throw new Error(data.error ?? 'Voice Agent is unavailable.');
      const audio = new AudioContext({ sampleRate: 24000 });
      context.current = audio;
      const media = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      stream.current = media;
      const source = audio.createMediaStreamSource(media);
      const processor = audio.createScriptProcessor(2048, 1, 1);
      source.connect(processor);
      processor.connect(audio.destination);
      const ws = new WebSocket(
        `wss://agents.assemblyai.com/v1/ws?token=${encodeURIComponent(data.token)}`,
      );
      socket.current = ws;
      let ready = false;
      ws.onopen = () =>
        ws.send(
          JSON.stringify({
            type: 'session.update',
            session: { agent_id: data.agentId },
          }),
        );
      processor.onaudioprocess = (event) => {
        if (!ready || ws.readyState !== WebSocket.OPEN) return;
        const floats = event.inputBuffer.getChannelData(0);
        const pcm = new Int16Array(floats.length);
        for (let i = 0; i < floats.length; i++)
          pcm[i] = Math.max(
            -32768,
            Math.min(32767, Math.round(floats[i] * 32767)),
          );
        let binary = '';
        new Uint8Array(pcm.buffer).forEach(
          (byte) => (binary += String.fromCharCode(byte)),
        );
        ws.send(JSON.stringify({ type: 'input.audio', audio: btoa(binary) }));
      };
      ws.onmessage = (event) => {
        const message = JSON.parse(event.data) as {
          type: string;
          text?: string;
          message?: string;
        };
        if (message.type === 'session.ready') {
          ready = true;
          setState('listening');
        } else if (message.type === 'transcript.user.delta')
          setPreview(message.text ?? '');
        else if (message.type === 'transcript.user') {
          setPreview('');
          onTranscript(message.text ?? '');
        } else if (message.type === 'session.error') {
          setError(message.message ?? 'Voice session failed.');
          cleanup();
        } else if (message.type === 'session.ended') cleanup();
      };
      ws.onclose = () => cleanup();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'Could not start voice.',
      );
      setState('error');
    }
  }, [cleanup, onTranscript]);
  const stop = useCallback(() => {
    if (socket.current?.readyState === WebSocket.OPEN)
      socket.current.send(JSON.stringify({ type: 'session.end' }));
    setTimeout(cleanup, 700);
  }, [cleanup]);
  useEffect(() => () => cleanup(), [cleanup]);
  return {
    start,
    stop,
    state,
    preview,
    error,
    isActive: state === 'connecting' || state === 'listening',
  };
}
