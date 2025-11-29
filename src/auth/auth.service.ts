import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface CreateUserDto {
  auth0Id: string;
  email: string;
  name?: string;
  picture?: string;
}

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async findOrCreateUser(data: CreateUserDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { auth0Id: data.auth0Id },
    });

    if (existingUser) {
      return this.prisma.user.update({
        where: { auth0Id: data.auth0Id },
        data: {
          email: data.email,
          name: data.name,
          picture: data.picture,
        },
      });
    }

    return this.prisma.user.create({ data });
  }

  async findUserById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async updateGoogleTokens(
    userId: string,
    accessToken: string,
    refreshToken: string | null,
    expiresAt: Date,
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        googleAccessToken: accessToken,
        googleRefreshToken: refreshToken || undefined,
        googleTokenExpiresAt: expiresAt,
        isGoogleCalendarConnected: true,
      },
    });
  }

  async disconnectGoogleCalendar(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        googleAccessToken: null,
        googleRefreshToken: null,
        googleTokenExpiresAt: null,
        isGoogleCalendarConnected: false,
      },
    });
  }
}