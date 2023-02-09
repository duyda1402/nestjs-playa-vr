import { PostMetaEntity } from './post_meta.entity';
import { UserEntity } from './user.entity';
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';

@Entity({ name: 'wp_rkr3j35p5r_posts' })
export class PostEntity {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  @ManyToOne((_T) => UserEntity, (user) => user.posts)
  @JoinColumn({ name: 'post_author' })
  postAuthor: UserEntity;

  @Column({ type: 'datetime', name: 'post_date' })
  postDate: Date;

  @Column({ type: 'datetime', name: 'post_date_gmt' })
  postDateGmt: Date;

  @Column({ type: 'blob', name: 'post_content' })
  postContent: Buffer;

  @Column({ type: 'blob', name: 'post_title' })
  postTitle: Buffer;

  @Column({ type: 'blob', name: 'post_excerpt' })
  postExcerpt: Buffer;

  @Column({ name: 'post_status' })
  postStatus: string;

  @Column({ name: 'commentStatus' })
  commentStatus: string;

  @Column({ name: 'ping_status' })
  pingStatus: string;

  @Column({ name: 'post_password' })
  postPassword: string;

  @Column({ name: 'post_name' })
  postName: string;

  @Column({ type: 'blob', name: 'to_ping' })
  toPing: Buffer;

  @Column({ type: 'blob', name: 'pinged' })
  pinged: Buffer;

  @Column({ type: 'datetime', name: 'post_modified' })
  postModified: Date;

  @Column({ type: 'datetime', name: 'post_modified_gmt' })
  postModifiedGmt: Date;

  @Column({ type: 'blob', name: 'post_content_filtered' })
  postContentFiltered: Buffer;

  @Column({ name: 'post_parent' })
  postParent: number;

  @Column({ name: 'guid' })
  guid: string;

  @Column({ name: 'menu_order' })
  menuOrder: number;

  @Column({ name: 'comment_count' })
  commentCount: number;

  @Column({ name: 'postType' })
  postType: string;

  @Column({ name: 'post_mime_type' })
  postMimeType: string;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  @OneToMany((_T) => PostMetaEntity, (post) => post.postId)
  postMetas: PostMetaEntity[];
}
