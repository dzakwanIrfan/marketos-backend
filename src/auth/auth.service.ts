import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Response } from 'express';
import ms, { StringValue } from 'ms';
import { UsersService } from 'src/users/users.service';
import { TokenPayLoad } from './token-payload.interface';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UsersService, 
        private readonly configService: ConfigService,
        private readonly jwtService: JwtService,
    ) {}

    async login(user: User, response: Response) {
        const expires = new Date();
        expires.setMilliseconds(
            expires.getMilliseconds() + 
            ms(this.configService.getOrThrow<StringValue>('JWT_EXPIRATION')),
        );

        const tokenPayLoad: TokenPayLoad = {
            userId: user.id,
        };

        const token = this.jwtService.sign(tokenPayLoad);

        response.cookie('Authentication', token, {
            secure: true,
            httpOnly: true,
            expires,
        });

        return { tokenPayLoad };
    }

    async verifyUser(email: string, password: string) {
        try {
            const user = await this.userService.getUser({email});
            const authenticated = await bcrypt.compare(password, user.password);
            if (!authenticated) {
                throw new UnauthorizedException('Invalid credentials');
            }
            return user;
        } catch (error) {
            throw new UnauthorizedException('Invalid credentials');
        }
    }
}
