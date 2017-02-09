/**
 * Created by lkroepfl on 09.02.17.
 */

import Logger from '../utils/Logger';

class RemoteControl {
  static MESSAGE_NAMESPACE = 'urn:x-cast:com.bitmovin.analytics.cast';

  constructor() {
    this.castSession = cast.framework.CastContext.getInstance().getCurrentSession();
    this.addMessageListener();
  }

  addMessageListener() {
    this.castSession.addMessageListener(RemoteControl.MESSAGE_NAMESPACE, (ns, message) => {
      Logger.log('Received: ' + ns + ' ' + message);

      try {
        const receiverMessage = JSON.parse(message);
        this.handleReceivedMessage(receiverMessage);

      } catch (error) {
        Logger.error('Message parsing failed' + message);
      }
    });
  }

  handleReceivedMessage(message) {

  }

  sendMessage(message) {
    Logger.log('Sending message: ' + JSON.stringify(message));
    this.castSession.sendMessage(RemoteControl.MESSAGE_NAMESPACE, message);
  }
}

export default RemoteControl;