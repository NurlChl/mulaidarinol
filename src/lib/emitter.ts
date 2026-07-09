import { EventEmitter } from "events";

declare global {
  // eslint-disable-next-line no-var
  var notificationEmitter: EventEmitter | undefined;
}

if (!global.notificationEmitter) {
  global.notificationEmitter = new EventEmitter();
  // Prevent memory warnings from multiple concurrent stream listeners
  global.notificationEmitter.setMaxListeners(100);
}

export const notificationEmitter = global.notificationEmitter;
export default notificationEmitter;
