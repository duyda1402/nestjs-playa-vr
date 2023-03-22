import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'video_tracking' })
export class VideoTrackingEntity {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({name: 'user_id'})
  userId: number;

  @Column({ name: 'user_ip' })
  userIp: string;

  @Column({ name: 'post_id' })
  postId: number;

  @Column({ name: 'video_attachment_id' })
  attachmentId: number;

  @Column({ name: 'video_attachment_type' })
  attachmentType: string;

  @Column()
  action: string;

  @Column()
  duration: number;

  @Column({ name: 'capped_duration' })
  cappedDuration: number;

  @Column()
  timestamp: number;

  @Column()
  category: string;

  @Column()
  tags: string;

  @Column()
  studio: string;

  @Column({ name: 'logged_in' })
  loggedIn: number;

  @Column()
  nfaction: number;

  @Column()
  created: number;

  @Column({ name: 'studio_id' })
  studioId: number;

  @Column({ name: 'user_agent' })
  userAgent: string;

}
