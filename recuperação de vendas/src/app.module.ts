import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WebhookModule } from './webhook/webhook.module';
import { SupabaseModule } from './supabase/supabase.module';
import { ClickUpModule } from './clickup/clickup.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    SupabaseModule,
    ClickUpModule,
    WebhookModule,
  ],
})
export class AppModule {}

