import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { passportJwtSecret } from "jwks-rsa";
import { ConfigService } from "@nestjs/config";
import { AuthService } from "../auth.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private configService: ConfigService,
        private authService: AuthService,
    ) {
        const issuerUrl = configService.get<string>("AUTH0_ISSUER_URL");
        const audience = configService.get<string>("AUTH0_AUDIENCE");

        super({
            secretOrKeyProvider: passportJwtSecret({
                cache: true,
                rateLimit: true,
                jwksRequestsPerMinute: 5,
                jwksUri: `${issuerUrl}.well-known/jwks.json`,
            }),

            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

            audience: audience,

            issuer: issuerUrl,

            algorithms: ["RS256"],
        });
    }

    async validate(payload: any) {
        if (!payload.sub) {
            throw new UnauthorizedException("Invalid token: missing subject");
        }

        const user = await this.authService.findOrCreateUser({
            auth0Id: payload.sub,
            email: payload.email || `${payload.sub}@auth0.local`,
            name: payload.name,
            picture: payload.picture,
        });

        return user;
    }
}
