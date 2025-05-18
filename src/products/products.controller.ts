import { Controller, Get } from '@nestjs/common';
import { ProductsService } from './products.service';
import { Product } from './entities/products.entity';

@Controller('products')
export class ProductsController {

    constructor(private readonly productsService: ProductsService) {}

    @Get()
    findAll(): Promise<Product[]> {
        return this.productsService.findAll();
    }

    @Get(':id')
    findOne(id: string): Promise<Product> {
        return this.productsService.findOne(id);
    }

}
