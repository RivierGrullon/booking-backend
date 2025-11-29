import { Module } from "@nestjs/common";

import { BookingsService } from "./bookings.service";
import { GoogleCalendarModule } from "../google-calendar/google-calendar.module";
import { BookingsController } from "./bookings.controller";
import { GoogleCalendarService } from "src/google-calendar/google-calendar.service";
import { PrismaService } from "src/prisma/prisma.service";

@Module({
  imports: [GoogleCalendarModule],
  controllers: [BookingsController],
  providers: [BookingsService, PrismaService, GoogleCalendarService],
})
export class BookingsModule {}
