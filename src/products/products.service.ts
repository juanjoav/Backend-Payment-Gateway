import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/products.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ProductsService {

    constructor(
        @InjectRepository(Product)
       private readonly productsRepository: Repository<Product>,
    ) {}

    async findAll(): Promise<Product[]> {
        const products = await this.productsRepository.find();
        
        return products.map(p => ({
            ...p,
            price: Number(p.price),
            }));
    }
    
    async findOne(id: string): Promise<Product> {
        const product = await this.productsRepository.findOne({ where: { id } });
        if (!product) {
            throw new NotFoundException(`Product with ID "${id}" not found`);
        }
        return product;
    }

    async create(product: Product): Promise<Product> {
        return this.productsRepository.save(product);
    }

    async remove(id: number): Promise<void> {
        await this.productsRepository.delete(id);
    }
}