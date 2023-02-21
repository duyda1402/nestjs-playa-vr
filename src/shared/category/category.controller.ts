import { Controller, Get, Query } from '@nestjs/common';
import { IFRsp } from 'src/types';
import { CategoryService } from './category.service';

@Controller('')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get('/categories')
  async getActors(): Promise<IFRsp<any>> {
    const result = await this.categoryService.getCategoryList();
    return {
      status: { code: 1, message: 'okey' },
      data: result,
    };
  }
}
