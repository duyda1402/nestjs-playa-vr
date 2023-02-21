import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'wp_rkr3j35p5r_posts' })
export class PostEntity {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'post_author' })
  postAuthor: number;

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

  @Column({ name: 'comment_status' })
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

  @Column({ name: 'post_type' })
  postType: string;

  @Column({ name: 'post_mime_type' })
  postMimeType: string;
}
