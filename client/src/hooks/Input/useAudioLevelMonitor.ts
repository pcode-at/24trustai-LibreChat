import { useEffect, useRef, useState } from 'react';

const BAR_COUNT = 32;
const SAMPLE_INTERVAL_MS = 90;
const LEVEL_SENSITIVITY = 3.2;

const createSilentLevels = () => new Array<number>(BAR_COUNT).fill(0);

/**
 * Captures a microphone stream purely for visualization while a recording is
 * active, exposing a rolling buffer of normalized audio levels (0..1) and the
 * elapsed recording time in seconds. Independent of the active STT path so the
 * same waveform and timer can be shown for both browser and external recording.
 * The timer runs even if the visualization stream cannot be acquired.
 */
const useAudioLevelMonitor = (
  isActive: boolean,
): {
  levels: number[];
  recordingTime: number;
} => {
  const [levels, setLevels] = useState<number[]>(createSilentLevels);
  const [recordingTime, setRecordingTime] = useState(0);

  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const intervalIdRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentLevelRef = useRef(0);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    let isMounted = true;
    const startTime = Date.now();
    setRecordingTime(0);

    intervalIdRef.current = setInterval(() => {
      setLevels((previous) => [...previous.slice(1), currentLevelRef.current]);
      setRecordingTime(Math.floor((Date.now() - startTime) / 1000));
    }, SAMPLE_INTERVAL_MS);

    const startVisualization = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;

        const audioContext = new AudioContext();
        audioContextRef.current = audioContext;
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 1024;
        source.connect(analyser);

        const timeDomainData = new Uint8Array(analyser.frequencyBinCount);

        const measure = () => {
          analyser.getByteTimeDomainData(timeDomainData);
          let sumSquares = 0;
          for (let i = 0; i < timeDomainData.length; i++) {
            const amplitude = (timeDomainData[i] - 128) / 128;
            sumSquares += amplitude * amplitude;
          }
          const rms = Math.sqrt(sumSquares / timeDomainData.length);
          currentLevelRef.current = Math.min(1, rms * LEVEL_SENSITIVITY);
          animationFrameIdRef.current = window.requestAnimationFrame(measure);
        };
        animationFrameIdRef.current = window.requestAnimationFrame(measure);
      } catch {
        currentLevelRef.current = 0;
      }
    };

    void startVisualization();

    return () => {
      isMounted = false;
      if (animationFrameIdRef.current !== null) {
        window.cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      if (intervalIdRef.current !== null) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      if (audioContextRef.current) {
        void audioContextRef.current.close();
        audioContextRef.current = null;
      }
      currentLevelRef.current = 0;
      setLevels(createSilentLevels());
      setRecordingTime(0);
    };
  }, [isActive]);

  return { levels, recordingTime };
};

export default useAudioLevelMonitor;
