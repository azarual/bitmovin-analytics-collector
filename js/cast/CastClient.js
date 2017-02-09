/**
 * Created by lkroepfl on 09.02.17.
 */

import {MESSAGE_NAMESPACE} from '../utils/Settings';
import Logger from '../utils/Logger';

class RemoteControl {
  constructor() {
    this.castSession = cast.framework.CastContext.getInstance().getCurrentSession();
    this.addMessageListener();
  }

  addMessageListener() {
    this.castSession.addMessageListener(MESSAGE_NAMESPACE, (ns, message) => {
      Logger.log('Received: ' + ns + ' ' + message);

      try {
        const receiverMessage = JSON.parse(message);
        this.handleReceiverMessage(receiverMessage);

      } catch (error) {
        Logger.error('Message parsing failed ' + message);
      }
    });
  }

  handleReceiverMessage(message) {
    Logger.log(message);
  }

  sendMessage(message) {
    Logger.log('Sending message: ' + JSON.stringify(message));
    this.castSession.sendMessage(MESSAGE_NAMESPACE, message);
  }
}

export default RemoteControl;