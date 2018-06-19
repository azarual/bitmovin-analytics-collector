export enum MIMEType {
  MP4 = 'video/mp4',
  WEBM = 'video/webm',
  HLS = 'application/x-mpegURL',
  DASH = 'application/dash+xml'
};

export function getMIMETypeFromFileExtension(path: string): MIMEType | null {
  path = path.toLowerCase();

  if (path.endsWith('.m3u8')) {
    return MIMEType.HLS;
  }
  if (path.endsWith('.mp4') || path.endsWith('.m4v') || path.endsWith('.m4a')) {
    return MIMEType.MP4;
  }
  if (path.endsWith('.webm')) {
    return MIMEType.WEBM;
  }
  if (path.endsWith('.mpd')) {
    return MIMEType.DASH;
  }
  return null;
}



