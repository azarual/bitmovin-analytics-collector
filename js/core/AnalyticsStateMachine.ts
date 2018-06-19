export interface AnalyticsStateMachine {
  updateMetadata(data: any): void;

  callEvent(eventType: any, eventObject: any, timestamp: number): void;


}

export interface AnalyticsStateMachineCallbacks {
  setVideoTimeStartFromEvent(event: any): void;
  setVideoTimeEndFromEvent(event: any): void;
}

export type AnalyticsStateMachineOptions = {

}
