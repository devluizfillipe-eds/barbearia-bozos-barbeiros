import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { QueueModule } from './queue/queue.module';
import { BarbersModule } from './barbers/barbers.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    QueueModule,
    BarbersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
