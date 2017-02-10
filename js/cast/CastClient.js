/**
 * Created by lkroepfl on 09.02.17.
 */

import {MESSAGE_NAMESPACE} from '../utils/Settings';
import Logger from '../utils/Logger';

class RemoteControl {
  setUp() {
    this.castSession = cast.framework.CastContext.getInstance().getCurrentSession();
    this.addMessageListener();
  }

  addMessageListener() {
    this.castSession.addMessageListener(MESSAGE_NAMESPACE, (ns, message) => {
      console.log('Received: ' + ns + ' ' + message);

      try {
        const receiverMessage = JSON.parse(message);
        this.handleReceiverMessage(receiverMessage);

      } catch (error) {
        console.error('Message parsing failed ' + message);
      }
    });
  }

  handleReceiverMessage(message) {
    console.log(message);
  }

  sendMessage(message) {
    console.log('Sending message: ' + JSON.stringify(message));
    this.castSession.sendMessage(MESSAGE_NAMESPACE, message);
  }
}

export default RemoteControl;