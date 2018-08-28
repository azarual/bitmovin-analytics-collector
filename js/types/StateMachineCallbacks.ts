export interface StateMachineCallbacks {
  [key: string]: any;
  setup: (time: number, state: string, event: string) => void;
  startup: (time: number, state: string) => void;
  updateSample: (playbackSettings: any) => void;
  playing: (time: number, state: string, event: string) => void;
  playingAndBye: (time: number, state: string, event: string) => void;
  heartbeat: (time: number, state: any, event: string) => void;
  qualitychange: (time: number, state: string) => void;
  qualitychange_pause: (time: number, state: string) => void;
  qualitychange_rebuffering: (time: number, state: string) => void;
  videoChange: (event: string) => void;
  audioChange: (event: any) => void;
  pause: (time: number, state: string, event: string) => void;
  paused_seeking: (time: number, state: string, event: string) => void;
  end_play_seeking: (time: number, state: string, event: string) => void;
  rebuffering: (time: number, state: string, event: string) => void;
  error: (event: any) => void;
  end: (time: number, state: string, event: string) => void;
  ad: (time: number, state: string, event: string) => void;
  ad_ending: (time: number, state: string, event: string) => void;
  mute: () => void;
  unMute: () => void;
  setVideoTimeEndFromEvent: (event: any) => void;
  setVideoTimeStartFromEvent: (event: any) => void;
  startCasting: (timestamp: number, event: any) => void;
  casting: () => void;
  source_changing: () => void;
}
