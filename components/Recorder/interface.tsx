export interface IRecorder {
  onStart: (stream: MediaStream) => void
  onFinish: (chucks: File) => void
}