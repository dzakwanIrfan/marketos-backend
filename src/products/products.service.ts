import { Injectable } from '@nestjs/common';
import { createProductRequest } from './dto/create-product.request';
import { PrismaService } from 'src/prisma/prisma.service';
import { promises as fs } from 'fs';
import { join } from 'path';

@Injectable()
export class ProductsService {
    constructor(private readonly prismaService: PrismaService) {}

    async createProduct(data: createProductRequest, userId: number) {
        return this.prismaService.product.create({
            data: {
                ...data,
                userId,
            },
        });
    };

    private async getImagePath(productId: number): Promise<string | null> {
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        const basePath = join(__dirname, '../../', 'public/products');
        
        try {
            const files = await fs.readdir(basePath);
            const foundFile = files.find(file => {
                return file.startsWith(productId.toString());
            });
            
            return foundFile ? `/products/${foundFile}` : null;
        } catch (error) {
            return null;
        }
    }
    
    // Di getProducts():
    async getProducts() {
        const products = await this.prismaService.product.findMany();
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
};
