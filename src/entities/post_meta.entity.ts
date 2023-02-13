import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'wp_rkr3j35p5r_postmeta' })
export class PostMetaEntity {
  @PrimaryGeneratedColumn({ name: 'meta_id' })
  id: number;

  @Column({ name: 'post_id' })
  postId: number;

  @Column({ name: 'meta_key' })
  metaKey: string;

  @Column({ type: 'blob', name: 'meta_value' })
  metaValue: Buffer;
}
