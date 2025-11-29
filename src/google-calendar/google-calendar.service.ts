import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { calendar_v3, google } from 'googleapis';
import { PrismaService } from '../prisma/prisma.service';

export interface CalendarConflictResult {
  hasConflict: boolean;
  conflictingEvents: calendar_v3.Schema$Event[];
}

@Injectable()
export class GoogleCalendarService {
  private readonly logger = new Logger(GoogleCalendarService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}


  private createOAuthClient() {
    return new google.auth.OAuth2(
      this.config.get<string>('GOOGLE_CLIENT_ID'),
      this.config.get<string>('GOOGLE_CLIENT_SECRET'),
      this.config.get<string>('GOOGLE_REDIRECT_URI'),
    );
  }

  private createCalendar(auth: any) {
    return new calendar_v3.Calendar({ auth });
  }



  getAuthUrl(userId: string): string {
    const oauth = this.createOAuthClient();

    return oauth.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      state: userId,
      scope: [
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/calendar.events.readonly',
      ],
    });
  }

  async getTokensFromCode(code: string) {
    const oauth = this.createOAuthClient();
    const { tokens } = await oauth.getToken(code);
    return tokens;
  }



  private async getAuthenticatedClient(
    userId: string,
  ): Promise<any | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        googleAccessToken: true,
        googleRefreshToken: true,
        googleTokenExpiresAt: true,
      },
    });

    if (!user?.googleAccessToken) return null;

    const oauth = this.createOAuthClient();

    oauth.setCredentials({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken ?? undefined,
      expiry_date: user.googleTokenExpiresAt?.getTime(),
    });

    // Refresh if expired
    const isExpired =
      user.googleTokenExpiresAt &&
      new Date() >= new Date(user.googleTokenExpiresAt);

    if (isExpired) {
      try {
        const { credentials } = await oauth.refreshAccessToken();

        await this.prisma.user.update({
          where: { id: userId },
          data: {
            googleAccessToken: credentials.access_token,
            googleTokenExpiresAt: credentials.expiry_date
              ? new Date(credentials.expiry_date)
              : null,
          },
        });

        oauth.setCredentials(credentials);
      } catch (err) {
        this.logger.error('Failed to refresh token', err);
        return null;
      }
    }

    return oauth;
  }


  async checkForConflicts(
    userId: string,
    start: Date,
    end: Date,
  ): Promise<CalendarConflictResult> {
    const auth = await this.getAuthenticatedClient(userId);
    if (!auth) {
      return { hasConflict: false, conflictingEvents: [] };
    }

    const calendar = this.createCalendar(auth);

    try {
      const res = await calendar.events.list({
        calendarId: 'primary',
        timeMin: start.toISOString(),
        timeMax: end.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });

      const events = res.data.items ?? [];

      const conflicting = events.filter((ev) => {
        if (!ev.start?.dateTime || !ev.end?.dateTime) return false;

        const eStart = new Date(ev.start.dateTime);
        const eEnd = new Date(ev.end.dateTime);

        return start < eEnd && end > eStart;
      });

      return {
        hasConflict: conflicting.length > 0,
        conflictingEvents: conflicting,
      };
    } catch (err) {
      this.logger.error('Error checking conflicts', err);
      return { hasConflict: false, conflictingEvents: [] };
    }
  }



  async getEvents(
    userId: string,
    start: Date,
    end: Date,
  ): Promise<calendar_v3.Schema$Event[]> {
    const auth = await this.getAuthenticatedClient(userId);
    if (!auth) return [];

    const calendar = this.createCalendar(auth);

    try {
      const res = await calendar.events.list({
        calendarId: 'primary',
        timeMin: start.toISOString(),
        timeMax: end.toISOString(),
        singleEvents: true,
        maxResults: 100,
        orderBy: 'startTime',
      });

      return res.data.items ?? [];
    } catch (err) {
      this.logger.error('Error fetching events', err);
      return [];
    }
  }
}
