import { Injectable } from '@nestjs/common';
import { DataNotFoundException } from 'src/exceptions/data.exception';
import { PostRepository } from 'src/repository/post.repository';
import { IFPage, IFVideoListView } from 'src/types';
import { IFVideoView } from 'src/types/index';

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
    const content = data.map((item) => ({
      id: item?.postName,
      title: item?.postTitle,
      subtitle: 'Cat Pictures Fox',
      preview_image: 'https://placekitten.com/200/300',
      release_date: new Date(item?.postDate).getTime(),
      details: [
        {
          type: 'trailer',
          duration_seconds: 90,
        },
      ],
    }));

    const result = {
      page_index: query.page,
      item_count: query.perPage,
      page_total: Math.ceil(itemTotal / query.perPage),
      item_total: itemTotal,
      content: content,
    };
    return result;
  }
  async getVideoDetail(id: string): Promise<IFVideoView | null> {
    const result = await this.postRepository.getPostDetailsVrVideos(id);
    if (!result) throw new DataNotFoundException('Studio not found');
    return {
      id: result?.postName,
      title: result?.postTitle,
      subtitle: 'Cat Pictures Fox',
      description: result?.postContent,
      preview_image: 'https://placekitten.com/200/300',
      release_date: new Date(result?.postDate).getTime(),
      studio: result?.studio,
      categories: result?.categories,
      actors: result?.actors,
      views: 500,
      details: [],
    };
  }
}
