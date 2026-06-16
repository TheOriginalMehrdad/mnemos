import { Global, Module } from '@nestjs/common';
import { EruditioGateway } from './eruditio.gateway';

/**
 * Realtime layer. Global so any service can inject EruditioGateway to emit
 * WebSocket events without importing this module explicitly.
 */
@Global()
@Module({
  providers: [EruditioGateway],
  exports: [EruditioGateway],
})
export class RealtimeModule {}
