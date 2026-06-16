import { Global, Module } from '@nestjs/common';
import { EmbeddingsService } from './embeddings.service';
import { ChatAiService } from './chat-ai.service';
import { StubAiProvider } from './stub-ai.provider';
import { AI_PROVIDER } from './ai-provider.interface';

@Global()
@Module({
  providers: [
    EmbeddingsService,
    ChatAiService,
    StubAiProvider,
    { provide: AI_PROVIDER, useExisting: StubAiProvider },
  ],
  exports: [EmbeddingsService, ChatAiService, AI_PROVIDER],
})
export class AiModule {}
