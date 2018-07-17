import {MESSAGE_NAMESPACE} from '../utils/Settings';
import logger from '../utils/Logger';

/* global cast */

class CastReceiver {
  messageBus: any;
  callback: any;
  setUp() {
    const castReceiverManager = (window as any).cast.receiver.CastReceiverManager.getInstance();
    this.messageBus = castReceiverManager.getCastMessageBus(
      MESSAGE_NAMESPACE,
      (window as any).cast.receiver.CastMessageBus.MessageType.JSON
    );

    logger.log(this.messageBus);

    this.messageBus.onMessage = (message: any) => {
      logger.log('Received message from cast client: ' + JSON.stringify(message));

      const castClientMessage = message.data;
      this.handleClientMessage(castClientMessage);
    };
  }

  setCallback(callback: any) {
    this.callback = callback;
  }

  handleClientMessage(event: any) {
    this.callback(event);
  }

  sendMessage(message: any) {
    this.messageBus.broadcast(message);
  }
}

export default CastReceiver;
