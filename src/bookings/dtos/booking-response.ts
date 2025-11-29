import { ApiProperty } from '@nestjs/swagger';

export class BookingResponseDto {
  @ApiProperty({ example: 'clx123abcIDK...' })
  id: string;

  @ApiProperty({ example: 'Team Meeting' })
  name: string;

  @ApiProperty({ example: '2024-01-15T10:00:00.000Z' })
  startTime: Date;

  @ApiProperty({ example: '2024-01-15T11:00:00.000Z' })
  endTime: Date;

  @ApiProperty({ example: 'clx456defIDK...' })
  userId: string;

  @ApiProperty({ example: '2024-01-14T15:30:00.000Z' })
  createdAt: Date;
}