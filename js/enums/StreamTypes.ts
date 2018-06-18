import {MIMEType} from './MIMETypes';

const { MP4, WEBM, HLS, DASH } = MIMEType;
const mapping = {
  [MP4]: 'progressive',
  [WEBM]: 'progressive',
  [HLS]: 'hls',
  [DASH]: 'dash'
};

export function getStreamTypeFromMIMEType(mimeType: MIMEType): string {
  return mapping[mimeType];
}

