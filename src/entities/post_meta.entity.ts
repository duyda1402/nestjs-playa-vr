import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';

import { PostEntity } from './post.entity';

@Entity({ name: 'wp_rkr3j35p5r_postmeta' })
export class PostMetaEntity {
  @PrimaryGeneratedColumn({ name: 'meta_id' })
  id: number;

  @Column({ name: 'meta_key' })
  metaKey: string;

  @Column({ type: 'blob', name: 'meta_value' })
  metaValue: Buffer;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  @ManyToOne((_T) => PostEntity, (post) => post.postMetas)
  @JoinColumn({ name: 'post_id' })
  postId: PostEntity;
}
