import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TermTaxonomyEntity } from 'src/entities/term_taxonomy.entity';
import { Repository } from 'typeorm';
import { PostEntity } from 'src/entities/post.entity';
import { TermRelationShipsBasicEntity } from 'src/entities/term_relationships_basic.entity';

@Injectable()
export class PostRepository {
  constructor(
    @InjectRepository(PostEntity)
    private readonly postsRepository: Repository<PostEntity>
  ) {}

  async getPostByVrVideos(query: {
    page?: number;
    perPage?: number;
    where?: any;
    order?: string;
    title?: string;
    direction?: string;
  }): Promise<{ itemTotal: number; data: any }> {
    const direction = query.direction === 'desc' ? 'DESC' : 'ASC';
    const order = query.order === 'popularity' ? 'term.name' : 'term.name';

    const data = await this.postsRepository
      .createQueryBuilder('post')
      .innerJoin(TermRelationShipsBasicEntity, 'tr', 'post.id = tr.objectId')
      .where('tr.termId = :termId', { termId: 251 })
      .andWhere('post.postType = :postType', { postType: 'post' })
      .limit(query.perPage)
      //  .orderBy(order, direction)
      .offset((query.page - 1) * query.perPage)
      .getMany();
    console.log(data);
    const itemTotal = await this.postsRepository
      .createQueryBuilder('post')
      .innerJoin(TermRelationShipsBasicEntity, 'tr', 'post.id = tr.objectId')
      .where('tr.termId = :termId', { termId: 251 })
      .andWhere('post.postType = :postType', { postType: 'post' })
      .getCount();

    return { itemTotal, data };
  }
}
