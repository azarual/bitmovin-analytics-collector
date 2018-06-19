import { MIMEType } from "./MIMETypes";

const { MP4, WEBM, HLS, DASH } = MIMEType;

export enum StreamType {
  PROGRESSIVE = 'progressive',
  HLS = 'hls',
  DASH = 'dash'
}

const mapping: { [mimeType: string] : StreamType } = {
  [MP4]: StreamType.PROGRESSIVE,
  [WEBM]: StreamType.PROGRESSIVE,
  [HLS]: StreamType.HLS,
  [DASH]: StreamType.DASH
};

export function getStreamTypeFromMIMEType(mimeType: MIMEType): StreamType {
  return mapping[mimeType];
}
