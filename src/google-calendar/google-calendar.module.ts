import { Module } from '@nestjs/common';
import { GoogleCalendarService } from './google-calendar.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  providers: [GoogleCalendarService, PrismaService],
  exports: [GoogleCalendarService],
})
export class GoogleCalendarModule {}