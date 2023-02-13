import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TermTaxonomyEntity } from 'src/entities/term_taxonomy.entity';
import { Repository } from 'typeorm';
import { PostEntity } from 'src/entities/post.entity';
import { TermRelationShipsBasicEntity } from 'src/entities/term_relationships_basic.entity';
import { TermEntity } from 'src/entities/term.entity';

@Injectable()
export class PostRepository {
  constructor(
    @InjectRepository(PostEntity)
    private readonly postsRepository: Repository<PostEntity>,
    @InjectRepository(TermEntity)
    private readonly termRepository: Repository<TermEntity>
  ) {}
  async getPostDetailsVrVideos(id: string): Promise<any> {
    const post = await this.postsRepository
      .createQueryBuilder('post')
      .innerJoin(TermRelationShipsBasicEntity, 'tr', 'post.id = tr.objectId')
      .where('tr.termId = :termId', { termId: 251 })
      .andWhere('post.postType = :postType', { postType: 'post' })
      .andWhere('post.postName = :postName', { postName: id })
      .getOne();
    if (!post) return null;
    const studio = await this.termRepository
      .createQueryBuilder('term')
      .innerJoin(TermRelationShipsBasicEntity, 'tr', 'term.id = tr.termId')
      .leftJoinAndSelect(TermTaxonomyEntity, 'tt', 'term.id = tt.termId')
      .where('tr.objectId = :objectId', { objectId: post.id })
      .andWhere('tt.taxonomy = :taxonomy', { taxonomy: 'studio' })
      .select(['term.slug as id', 'term.name as title'])
      .getRawOne();
    const categories = await this.termRepository
      .createQueryBuilder('term')
      .innerJoin(TermRelationShipsBasicEntity, 'tr', 'term.id = tr.termId')
      .leftJoinAndSelect(TermTaxonomyEntity, 'tt', 'term.id = tt.termId')
      .where('tr.objectId = :objectId', { objectId: post.id })
      .andWhere('tt.taxonomy = :taxonomy', { taxonomy: 'post_tag' })
      .select(['term.slug as id', 'term.name as title'])
      .getRawMany();
    const actors = await this.termRepository
      .createQueryBuilder('term')
      .innerJoin(TermRelationShipsBasicEntity, 'tr', 'term.id = tr.termId')
      .leftJoinAndSelect(TermTaxonomyEntity, 'tt', 'term.id = tt.termId')
      .where('tr.objectId = :objectId', { objectId: post.id })
      .andWhere('tt.taxonomy = :taxonomy', { taxonomy: 'porn_star_name' })
      .select(['term.slug as id', 'term.name as title'])
      .getRawMany();
    return { ...post, studio, categories, actors };
  }
  async getPostByVrVideos(query: {
    page?: number;
    perPage?: number;
    where?: any;
    order?: string;
    title?: string;
    direction?: string;
  }): Promise<{ itemTotal: number; data: any }> {
    const direction = query.direction === 'desc' ? 'DESC' : 'ASC';
    const order = query.order === 'popularity' ? 'post.postTitle' : 'post.postTitle';

    const data = await this.postsRepository
      .createQueryBuilder('post')
      .innerJoin(TermRelationShipsBasicEntity, 'tr', 'post.id = tr.objectId')
      .where('tr.termId = :termId', { termId: 251 })
      .andWhere('post.postType = :postType', { postType: 'post' })
      .limit(query.perPage)
      .orderBy(order, direction)
      .offset((query.page - 1) * query.perPage)
      .getMany();

    const itemTotal = await this.postsRepository
      .createQueryBuilder('post')
      .innerJoin(TermRelationShipsBasicEntity, 'tr', 'post.id = tr.objectId')
      .where('tr.termId = :termId', { termId: 251 })
      .andWhere('post.postType = :postType', { postType: 'post' })
      .getCount();

    return { itemTotal, data };
  }
}
