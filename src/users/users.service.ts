/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, UnprocessableEntityException } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { CreateUserRequest } from "./dto/create-user.request";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class UsersService {
    constructor(private readonly prismaService: PrismaService) {}

    async createUser(data: CreateUserRequest) {
        try {
            return await this.prismaService.user.create({
                data: {
                    ...data,
                    password: await bcrypt.hash(data.password, 10),
                },
                select: {
                    id: true,
                    email: true,
                }
            });
            
        } catch (error) {
            console.error(error);
            if (error.code === "P2002") {
                throw new UnprocessableEntityException("Email already exists");
            }
            throw error;
        }
    }
}
