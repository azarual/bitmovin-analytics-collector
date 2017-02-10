/**
 * Created by lkroepfl on 09.02.17.
 */
import {MESSAGE_NAMESPACE} from '../utils/Settings';
import Logger from '../utils/Logger';

class CastReceiver {
  setUp() {
    const castReceiverManager = cast.receiver.CastReceiverManager.getInstance();
    this.messageBus = castReceiverManager.getCastMessageBus(
      MESSAGE_NAMESPACE,
      cast.receiver.CastMessageBus.MessageType.JSON
    );

    console.log(this.messageBus);

    this.messageBus.onMessage = (message) => {
      console.log('customMessageBus', message);

      try {
        const castClientMessage = message.data;
        this.handleClientMessage(castClientMessage);
      } catch (error) {
        console.error('illegal message', message, error);
      }
    };
  }

  setCallback(callback) {
    this.callback = callback;
  }

  handleClientMessage(event) {
    console.log(event);
    this.callback(event);
  }

  sendMessage(message) {
    this.messageBus.broadcast(message);
  }
}

export default CastReceiver;