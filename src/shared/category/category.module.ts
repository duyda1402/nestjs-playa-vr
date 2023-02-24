import { Module } from '@nestjs/common';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { EntitiesModule } from 'src/entities/entities.module';
import { CommonModule } from './../common/common.module';
@Module({
  imports: [EntitiesModule, CommonModule],
  controllers: [CategoryController],
  providers: [CategoryService],
})
export class CategoryModule {}
