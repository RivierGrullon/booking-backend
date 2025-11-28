import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { BookingsModule } from './bookings/bookings.module';
import { GoogleCalendarModule } from './google-calendar/google-calendar.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [AuthModule, BookingsModule, GoogleCalendarModule, PrismaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
