import { Injectable } from '@nestjs/common';
import { DataNotFoundException } from 'src/exceptions/data.exception';
import { PostRepository } from 'src/repository/post.repository';
import { IFPage, IFVideoListView } from 'src/types';

@Injectable()
export class VideoService {
  constructor(private readonly postRepository: PostRepository) {}

  async getVideoList(query: {
    page?: number;
    perPage?: number;
    order?: string;
    direction?: string;
    title?: string;
  }): Promise<IFPage<IFVideoListView[] | any>> {
    const { itemTotal, data } = await this.postRepository.getPostByVrVideos(query);
    const content = [
      {
        id: 'catz',
        title: 'Cat Amazing Show: Fluff and Meow',
        subtitle: 'Cat Pictures Fox',
        preview_image: 'https://placekitten.com/200/300',
        release_date: '1675264660',
        details: [
          {
            type: 'trailer',
            duration_seconds: 90,
          },
        ],
      },
    ];
    const result = {
      page_index: query.page,
      item_count: query.perPage,
      page_total: Math.ceil(itemTotal / query.perPage),
      item_total: itemTotal,
      content: content,
    };
    return result;
  }
}
