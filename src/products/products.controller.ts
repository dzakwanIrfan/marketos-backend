import { Body, Controller, FileTypeValidator, Get, MaxFileSizeValidator, ParseFilePipe, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { createProductRequest } from './dto/create-product.request';
import { CurrentUser } from '../auth/current-user.decorator';
import { TokenPayLoad } from '../auth/token-payload.interface';
import { ProductsService } from './products.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('products')
export class ProductsController {
    constructor(private readonly productService: ProductsService) {}

    @Post()
    @UseGuards(JwtAuthGuard)
    async createProduct(
        @Body() body: createProductRequest,
        @CurrentUser() user: TokenPayLoad
    ) {
        return this.productService.createProduct(body, user.userId);
    }

    @Post(':productId/image')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(
        FileInterceptor('image', {
            storage: diskStorage({
                destination: './public/products',
                filename: (req, file, callback) => {
                    if (!file) {
                        return callback(new Error('File not found'), '');
                    }
                    callback(null, 
                        `${req.params.productId}${extname(file.originalname)}`,
                    );
                },
            }),
        }),
    )
    async uploadProductImage(
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: 5000000 }),
                    new FileTypeValidator({ fileType: 'image/*' }),
                ],
            }),
        )
        _file: Express.Multer.File
    ) {
        return {
            message: 'Image uploaded successfully',
        }
    }

    @Get()
    @UseGuards(JwtAuthGuard)
    async getProducts() {
        return this.productService.getProducts();
    }
}
