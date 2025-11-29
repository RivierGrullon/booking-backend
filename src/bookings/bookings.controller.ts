import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/curreent-user.decorator';
import { CreateBookingDto } from './dtos/create-booking';
import { BookingResponseDto } from './dtos/booking-response';
import { BookingsService } from './bookings.service';


@ApiTags('Bookings')
@Controller('bookings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all bookings for the current user' })
  @ApiResponse({
    status: 200,
    description: 'List of bookings',
    type: [BookingResponseDto],
  })
  async findAll(@CurrentUser() user: any) {
    return this.bookingsService.findAllByUser(user.id);
  }

  @Get('slots')
  @ApiOperation({ summary: 'Get available slots and events for a specific date' })
  @ApiQuery({
    name: 'date',
    required: true,
    description: 'Date in YYYY-MM-DD format',
    example: '2024-01-15',
  })
  @ApiResponse({ status: 200, description: 'Slots and events for the date' })
  async getAvailableSlots(
    @CurrentUser() user: any,
    @Query('date') date: string,
  ) {
    return this.bookingsService.getAvailableSlots(user.id, date);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific booking by ID' })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiResponse({ status: 200, type: BookingResponseDto })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.bookingsService.findOne(id, user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new booking' })
  @ApiResponse({
    status: 201,
    description: 'Booking created successfully',
    type: BookingResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Time slot conflicts with existing booking or calendar event',
  })
  @ApiResponse({ status: 400, description: 'Invalid booking data' })
  async create(
    @CurrentUser() user: any,
    @Body() createBookingDto: CreateBookingDto,
  ) {
    return this.bookingsService.create(user.id, createBookingDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a booking' })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiResponse({ status: 200, description: 'Booking deleted successfully' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.bookingsService.remove(id, user.id);
  }
}