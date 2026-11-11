import dayjs from "dayjs";

/** 00:32:24, hours, minutes and seconds, as in the recording card design. */
export function formatRecordingClock(seconds?: number) {
  return dayjs().startOf("day").add(Math.max(0, Math.floor(seconds || 0)), "second").format("HH:mm:ss");
}
