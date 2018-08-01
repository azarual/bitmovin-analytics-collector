import {Bitmovin7AnalyticsStateMachine} from '../js/analyticsStateMachines/Bitmovin7AnalyticsStateMachine';
import each from 'jest-each';
import * as statesFromFile from './doubleClickonTimeline.json';

const stateMachine = new Bitmovin7AnalyticsStateMachine(null, null);
stateMachine.setEnabledDebugging(true);
let statesfromStateMachine = [];

for (let i = 0; i < statesFromFile.length; i++) {
  const state = statesFromFile[i];
  stateMachine.callEvent(state.event, state.eventObject, state.timestamp);
}

statesfromStateMachine = stateMachine.getStates();
statesfromStateMachine = JSON.parse(JSON.stringify(statesfromStateMachine));

for (let z = 0; z < statesfromStateMachine.length; z++) {
  const stateFromMachine=statesfromStateMachine[z];
  const stateFromFile=statesFromFile[z];
  each([[stateFromMachine,stateFromFile]]).test(
    'Test: ' + stateFromFile.event + ' From: ' + stateFromFile.from + ' To: ' + stateFromFile.to,
    (statefromStateMachine, stateFromFile) => {
      expect(statefromStateMachine.event).toEqual(stateFromFile.event);
      expect(statefromStateMachine.from).toEqual(stateFromFile.from);
      expect(statefromStateMachine.to).toEqual(stateFromFile.to);
    }
  );
}
