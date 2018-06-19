import { Event } from "../enums/Events";
import { AnalyticsStateMachine } from './AnalyticsStateMachine';

export type AdapterEventCallback = (event: Event, eventData: any) => void;

export abstract class Adapter {
  constructor(
    public player: any,
    public eventCallback: AdapterEventCallback,
    public stateMachine: AnalyticsStateMachine
  ) {}
}
