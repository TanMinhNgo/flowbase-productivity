'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type StreamingState = 'idle' | 'connecting' | 'recording' | 'error';
type TokenResponse = {
  token: string;
  expiresInSeconds: number;
  error?: string;
};

type StreamingOptions = {
  onFinalTranscript: (transcript: string) => void;
};

export function useAssemblyAIStreaming({
  onFinalTranscript,
}: StreamingOptions) {
  const [state, setState] = useState<StreamingState>('idle');
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const callbackRef = useRef(onFinalTranscript);
  const socketRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const workletRef = useRef<AudioWorkletNode | null>(null);
  const sinkRef = useRef<GainNode | null>(null);
  const stoppingRef = useRef(false);
  const terminateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    callbackRef.current = onFinalTranscript;
  }, [onFinalTranscript]);

  const cleanup = useCallback(() => {
    if (terminateTimerRef.current) clearTimeout(terminateTimerRef.current);
    terminateTimerRef.current = null;
    workletRef.current?.disconnect();
    sourceRef.current?.disconnect();
    sinkRef.current?.disconnect();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    if (contextRef.current && contextRef.current.state !== 'closed') {
      void contextRef.current.close();
    }
    workletRef.current = null;
    sourceRef.current = null;
    sinkRef.current = null;
    streamRef.current = null;
    contextRef.current = null;
    socketRef.current = null;
    stoppingRef.current = false;
    setPreview('');
  }, []);

  const stop = useCallback(() => {
    const socket = socketRef.current;
    if (!socket) {
      cleanup();
      setState('idle');
      return;
    }
    stoppingRef.current = true;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    workletRef.current?.disconnect();
    sourceRef.current?.disconnect();
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'Terminate' }));
      terminateTimerRef.current = setTimeout(() => socket.close(), 3000);
    } else {
      socket.close();
    }
  }, [cleanup]);

  const start = useCallback(async () => {
    if (state === 'connecting' || state === 'recording') return;
    setError('');
    setPreview('');
    setState('connecting');
    try {
      if (!navigator.mediaDevices?.getUserMedia || !window.AudioWorkletNode)
        throw new Error('This browser does not support microphone streaming.');

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      streamRef.current = stream;
      const tokenResponse = await fetch('/api/assemblyai/token', {
        cache: 'no-store',
      });
      const tokenData = (await tokenResponse.json()) as TokenResponse;
      if (!tokenResponse.ok || !tokenData.token)
        throw new Error(
          tokenData.error ?? 'Could not create a speech session.',
        );

      const context = new AudioContext();
      contextRef.current = context;
      await context.audioWorklet.addModule('/assemblyai-pcm-processor.js');
      const source = context.createMediaStreamSource(stream);
      const worklet = new AudioWorkletNode(context, 'assemblyai-pcm-processor');
      const sink = context.createGain();
      sink.gain.value = 0;
      source.connect(worklet);
      worklet.connect(sink);
      sink.connect(context.destination);
      sourceRef.current = source;
      workletRef.current = worklet;
      sinkRef.current = sink;

      const url = new URL('wss://streaming.assemblyai.com/v3/ws');
      url.searchParams.set('token', tokenData.token);
      url.searchParams.set('speech_model', 'universal-3-5-pro');
      url.searchParams.set('sample_rate', '16000');
      const socket = new WebSocket(url);
      socket.binaryType = 'arraybuffer';
      socketRef.current = socket;

      worklet.port.onmessage = (event: MessageEvent<ArrayBuffer>) => {
        if (socket.readyState === WebSocket.OPEN) socket.send(event.data);
      };
      socket.onopen = () => setState('recording');
      socket.onmessage = (event) => {
        const message = JSON.parse(event.data as string) as {
          type?: string;
          transcript?: string;
          end_of_turn?: boolean;
        };
        if (message.type !== 'Turn' || !message.transcript) return;
        if (message.end_of_turn) {
          callbackRef.current(message.transcript);
          setPreview('');
        } else {
          setPreview(message.transcript);
        }
      };
      socket.onerror = () => setError('Speech-to-text connection failed.');
      socket.onclose = () => {
        cleanup();
        setState('idle');
      };
    } catch (reason) {
      cleanup();
      setState('error');
      setError(
        reason instanceof Error ? reason.message : 'Could not start recording.',
      );
    }
  }, [cleanup, state]);

  useEffect(() => () => stop(), [stop]);

  return {
    start,
    stop,
    isRecording: state === 'connecting' || state === 'recording',
    isConnecting: state === 'connecting',
    preview,
    error,
  };
}
