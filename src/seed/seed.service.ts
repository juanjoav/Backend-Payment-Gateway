import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common'; 
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from 'src/products/entities/products.entity';
import { Repository } from 'typeorm';

@Injectable()
export class SeedService implements OnApplicationBootstrap { 
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
  ) {
    this.logger.log('SeedService instanciado.');
  }

  async onApplicationBootstrap() {
    this.logger.log('onApplicationBootstrap: Iniciando proceso de sembrado de productos...');
    await this.seedProducts(); // Llama a tu método de sembrado aquí
    this.logger.log('onApplicationBootstrap: Proceso de sembrado de productos finalizado.');
  }

  async seedProducts() {
    this.logger.log('seedProducts: Verificando si se necesita sembrar datos...');

    try {
      const count = await this.productsRepository.count();
      this.logger.log(`Número actual de productos en la base de datos: ${count}`);

      if (count > 0) {
        this.logger.log('La base de datos ya tiene productos. No se realizará el sembrado.');
        return 'La base de datos ya contiene productos. No se realizó el sembrado.';
      }

      this.logger.log('Procediendo a sembrar productos...');
      const products = [
        {
          name: 'Smartphone Premium',
          description: 'Último modelo con cámara de 108MP',
          price: 1999999,
          stock: 50,
          imageUrl: 'https://media.metrolatam.com/2019/04/17/samsunggalaxys10-3baa790bcda2a1857498eebc7f0a735b-1200x800.jpg',
        },
        {
          name: 'Laptop Profesional',
          description: '16GB RAM, 512GB SSD, Intel i7',
          price: 3499999,
          stock: 30,
          imageUrl: 'https://placeholder.pics/svg/300x300',
        },
        {
          name: 'Auriculares Inalámbricos',
          description: 'Cancelación de ruido activa',
          price: 599999,
          stock: 100,
          imageUrl: 'https://placeholder.pics/svg/300x300',
        },
      ];

      this.logger.log(`Productos definidos para sembrar: ${products.length}`);
      await this.productsRepository.save(products);
      this.logger.log('Productos sembrados exitosamente en la base de datos.');
      return 'Productos sembrados exitosamente';

    } catch (error) {
      this.logger.error('Error durante el sembrado de productos:', error);
      return 'Falló el sembrado de productos.';
    }
  }
}