/**
 * MP4/AAC comes first because it plays everywhere, including Safari, iPhones and the
 * mobile app. WebM recorded in Chrome may not play back on those.
 */
export const RECORDING_FORMATS = [
  "audio/mp4;codecs=mp4a.40.2",
  "audio/mp4",
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg",
];
