import { Controller, Get, Post, Query, Res, UseGuards } from '@nestjs/common';
import  type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/curreent-user.decorator';
import { AuthService } from './auth.service';
import { GoogleCalendarService } from '../google-calendar/google-calendar.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
    private googleCalendarService: GoogleCalendarService,
  ) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@CurrentUser() user: any) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      isGoogleCalendarConnected: user.isGoogleCalendarConnected,
    };
  }

  @Get('google/connect')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Google OAuth URL for calendar connection' })
  @ApiResponse({ status: 200, description: 'Returns Google OAuth URL' })
  async getGoogleAuthUrl(@CurrentUser() user: any) {
    const url = this.googleCalendarService.getAuthUrl(user.id);
    return { url };
  }

  @Get('google/callback')
  @ApiOperation({ summary: 'Google OAuth callback (redirect from Google)' })
  async googleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    const frontendUrl = this.configService.get('FRONTEND_URL');

    try {
      const tokens = await this.googleCalendarService.getTokensFromCode(code);

      await this.authService.updateGoogleTokens(
        state, // userId
        tokens.access_token!,
        tokens.refresh_token || null,
        new Date(Date.now() + (tokens.expiry_date || 3600000)),
      );

      res.redirect(`${frontendUrl}/dashboard?google=connected`);
    } catch (error) {
      console.error('Google OAuth error:', error);
      res.redirect(`${frontendUrl}/dashboard?google=error`);
    }
  }

  @Post('google/disconnect')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disconnect Google Calendar' })
  @ApiResponse({ status: 200, description: 'Google Calendar disconnected' })
  async disconnectGoogle(@CurrentUser() user: any) {
    await this.authService.disconnectGoogleCalendar(user.id);
    return { message: 'Google Calendar disconnected successfully' };
  }
}