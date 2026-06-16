import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import type { EruditioEvents } from '@eruditio/shared';

/**
 * Socket.io gateway for the '/eruditio' namespace. All realtime events
 * (vault progress, card generation, review updates, …) are broadcast here.
 */
@WebSocketGateway({ namespace: '/eruditio', cors: { origin: true } })
export class EruditioGateway {
  private readonly logger = new Logger(EruditioGateway.name);

  @WebSocketServer()
  private server!: Server;

  /**
   * Broadcast a typed ERUDITIO event to every connected client.
   * @param event Event name (one of the EruditioEvents keys).
   * @param payload Event payload matching the event type.
   */
  emit<K extends keyof EruditioEvents>(event: K, payload: EruditioEvents[K]): void {
    if (!this.server) {
      this.logger.warn(`Socket server not ready; dropping "${String(event)}"`);
      return;
    }
    this.server.emit(event as string, payload);
  }
}
