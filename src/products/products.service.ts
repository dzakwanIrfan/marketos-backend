import { Injectable, NotFoundException } from '@nestjs/common';
import { createProductRequest } from './dto/create-product.request';
import { PrismaService } from 'src/prisma/prisma.service';
import { promises as fs } from 'fs';
import { join } from 'path';
import { PRODUCT_IMAGES } from './product-images';
import { Prisma } from '@prisma/client';
import { ProductGateway } from './products.gateway';

@Injectable()
export class ProductsService {
    constructor(
        private readonly prismaService: PrismaService,
        private readonly productGateway: ProductGateway,
    ) {}

    async createProduct(data: createProductRequest, userId: number) {
        const product = await this.prismaService.product.create({
            data: {
                ...data,
                userId,
            },
        });
        this.productGateway.handleProductUpdated();
        return product;
    };

    private async getImagePath(productId: number): Promise<string | null> {
        
        try {
            const files = await fs.readdir(PRODUCT_IMAGES);
            const foundFile = files.find(file => {
                return file.startsWith(productId.toString());
            });
            return foundFile ? `/images/products/${foundFile}` : null;
        } catch (error) {
            return null;
        }
    }
    
    async getProducts(status?: string) {
        const args: Prisma.ProductFindManyArgs = {};
        if (status === 'available') {
            args.where = { sold: false };
        }
        const products = await this.prismaService.product.findMany(args);
        return Promise.all(
            products.map(async (product) => {
                const imagePath = await this.getImagePath(product.id);
                return {
                    ...product,
                    imageExists: !!imagePath,
                    imageUrl: imagePath 
                };
            })
        );
    }

    async getProduct(productId: number) {
        try {
            return {
                ...(await this.prismaService.product.findUniqueOrThrow({
                    where: { id: productId },
                })),
                imageExists: await this.getImagePath(productId),
                imageUrl: await this.getImagePath(productId),
            };
        } catch (error) {
            throw new NotFoundException(`Product not found with ID ${productId}`);
        }
    }

    async update(productId: number, data: Prisma.ProductUpdateInput) {
        await this.prismaService.product.update({
            where: { id: productId },
            data,
        });
        this.productGateway.handleProductUpdated();
    }
};
