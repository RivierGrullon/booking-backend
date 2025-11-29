import { IsString, IsNotEmpty, IsDateString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty({
    description: 'Name of the booking',
    example: 'Team Meeting',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  name: string;

  @ApiProperty({
    description: 'Start time in ISO 8601 format',
    example: '2024-01-15T10:00:00Z',
  })
  @IsDateString()
  startTime: string;

  @ApiProperty({
    description: 'End time in ISO 8601 format',
    example: '2024-01-15T11:00:00Z',
  })
  @IsDateString()
  endTime: string;
}