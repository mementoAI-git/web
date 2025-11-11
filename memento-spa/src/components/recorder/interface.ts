export interface RecorderProps {
  onStart: (stream: MediaStream) => void;
  onFinish: (file: File) => void;
}
