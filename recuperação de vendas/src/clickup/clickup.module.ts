import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClickUpService } from './clickup.service';

@Global()
@Module({
  imports: [ConfigModule.forRoot()],
  providers: [ClickUpService],
  exports: [ClickUpService],
})
export class ClickUpModule {}


