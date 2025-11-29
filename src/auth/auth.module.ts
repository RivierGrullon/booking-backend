import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { GoogleCalendarModule } from '../google-calendar/google-calendar.module';
import { JwtStrategy } from './strategies/jwt.statregy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PrismaService } from 'src/prisma/prisma.service';
@Module({
  imports: [

    PassportModule.register({ defaultStrategy: 'jwt' }),

    GoogleCalendarModule,
    PrismaModule
  ],
  controllers: [AuthController],
  providers: [
    JwtStrategy,   
    JwtAuthGuard,  
    AuthService,    
    PrismaService
  ],
  exports: [
    PassportModule, 
    AuthService,   
    JwtAuthGuard,   
  ],
})
export class AuthModule {}