/**
 * Created by lkroepfl on 09.02.17.
 */
import {MESSAGE_NAMESPACE} from '../utils/Settings';
import logger from '../utils/Logger';

class CastReceiver {
  setUp() {
    const castReceiverManager = cast.receiver.CastReceiverManager.getInstance();
    this.messageBus = castReceiverManager.getCastMessageBus(
      MESSAGE_NAMESPACE,
      cast.receiver.CastMessageBus.MessageType.JSON
    );

    logger.log(this.messageBus);

    this.messageBus.onMessage = (message) => {
      logger.log('Received message from cast client: ' + JSON.stringify(message));

      const castClientMessage = message.data;
      this.handleClientMessage(castClientMessage);
    };
  }

  setCallback(callback) {
    this.callback = callback;
  }

  handleClientMessage(event) {
    this.callback(event);
  }

  sendMessage(message) {
    this.messageBus.broadcast(message);
  }
}

export default CastReceiver;