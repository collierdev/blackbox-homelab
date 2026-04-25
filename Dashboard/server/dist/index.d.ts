import { Server } from 'socket.io';
import type { Notification } from './models/notification';
declare const io: Server<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any>;
export declare function emitNotification(notification: Notification): void;
export { io };
//# sourceMappingURL=index.d.ts.map