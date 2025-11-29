import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleCalendarService } from '../google-calendar/google-calendar.service';
import { CreateBookingDto } from './dtos/create-booking';

@Injectable()
export class BookingsService {
  constructor(
    private prisma: PrismaService,
    private googleCalendarService: GoogleCalendarService,
  ) {}

  async findAllByUser(userId: string) {
    return this.prisma.booking.findMany({
      where: { userId },
      orderBy: { startTime: 'asc' },
    });
  }

  async findOne(id: string, userId: string) {
    const booking = await this.prisma.booking.findFirst({
      where: { id, userId },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  async create(userId: string, dto: CreateBookingDto) {
    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);

    // Validate end time is after start time
    if (endTime <= startTime) {
      throw new BadRequestException('End time must be after start time');
    }

    // Validate not in the past
    if (startTime < new Date()) {
      throw new BadRequestException('Cannot book time slots in the past');
    }

    // 1. Check for conflicts with existing bookings in the system
    const existingBooking = await this.prisma.booking.findFirst({
      where: {
        userId,
        OR: [
          {

            startTime: { lte: startTime },
            endTime: { gt: startTime },
          },
          {

            startTime: { lt: endTime },
            endTime: { gte: endTime },
          },
          {
            startTime: { gte: startTime },
            endTime: { lte: endTime },
          },
        ],
      },
    });

    if (existingBooking) {
      throw new ConflictException({
        message: 'Time slot conflicts with an existing booking in the system',
        type: 'SYSTEM_CONFLICT',
        conflictingBooking: {
          id: existingBooking.id,
          name: existingBooking.name,
          startTime: existingBooking.startTime,
          endTime: existingBooking.endTime,
        },
      });
    }


    const googleConflict = await this.googleCalendarService.checkForConflicts(
      userId,
      startTime,
      endTime,
    );

    if (googleConflict.hasConflict) {
      const conflictingEvent = googleConflict.conflictingEvents[0];
      throw new ConflictException({
        message: 'Time slot conflicts with a Google Calendar event',
        type: 'GOOGLE_CALENDAR_CONFLICT',
        conflictingEvent: {
          summary: conflictingEvent.summary,
          start: conflictingEvent.start?.dateTime,
          end: conflictingEvent.end?.dateTime,
        },
      });
    }

    return this.prisma.booking.create({
      data: {
        name: dto.name,
        startTime,
        endTime,
        userId,
      },
    });
  }

  async remove(id: string, userId: string) {
    const booking = await this.prisma.booking.findFirst({
      where: { id, userId },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    await this.prisma.booking.delete({
      where: { id },
    });

    return { message: 'Booking deleted successfully', id };
  }

  async getAvailableSlots(userId: string, date: string) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get bookings for the day
    const bookings = await this.prisma.booking.findMany({
      where: {
        userId,
        startTime: { gte: startOfDay },
        endTime: { lte: endOfDay },
      },
      orderBy: { startTime: 'asc' },
    });


    const googleEvents = await this.googleCalendarService.getEvents(
      userId,
      startOfDay,
      endOfDay,
    );

    return {
      date,
      bookings,
      googleEvents: googleEvents.map((e) => ({
        id: e.id,
        summary: e.summary,
        start: e.start?.dateTime || e.start?.date,
        end: e.end?.dateTime || e.end?.date,
      })),
    };
  }
}
