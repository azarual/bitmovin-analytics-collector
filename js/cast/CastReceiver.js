/**
 * Created by lkroepfl on 09.02.17.
 */
import {MESSAGE_NAMESPACE} from '../utils/Settings';
import Logger from '../utils/Logger';

class CastReceiver {

  constructor() {
    const castReceiverManager = cast.receiver.CastReceiverManager.getInstance();
    this.messageBus = castReceiverManager.getCastMessageBus(
      MESSAGE_NAMESPACE,
      cast.receiver.CastMessageBus.MessageType.JSON
    );

    this.messageBus.onMessage = (event) => {
      Logger.log('customMessageBus', event);

      try {
        this.handleClientMessage(event);
      } catch (error) {
        Logger.error('illegal message', event, error);
      }
    };
  }

  handleClientMessage(event) {
    Logger.log(event);
  }

  sendMessage(message) {
    this.messageBus.broadcast(message);
  }
}

export default CastReceiver;