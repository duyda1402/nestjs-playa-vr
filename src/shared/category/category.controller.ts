import { Controller, Get, Query } from '@nestjs/common';
import { IFCategoryListView, IFRsp, IFPage } from 'src/types';
import { CategoryService } from './category.service';

@Controller('')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get('/categories')
  async getActors(@Query() query: any): Promise<IFRsp<any>> {
    const page = Number(query['page-index']) || 1;
    const perPage = Number(query['page-size']) || 20;
    const order = query['order'] || '';
    const direction = query['direction'] || 'asc';
    const title = query['title'] || '';
    const result = await this.categoryService.getCategoryList({
      page,
      perPage,
      direction,
      title,
      order,
    });
    return {
      status: { code: 1, message: 'okey' },
      data: result,
    };
  }
}
