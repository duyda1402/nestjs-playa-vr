import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'popular_scores' })
export class PopularScoresEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'post_id' })
  postId: number;

  @Column({ name: 'free_popular_score' })
  freePopularScore: number;

  @Column({ name: 'premium_popular_score' })
  premiumPopularScore: number;

  @Column({ name: 'total_popular_score' })
  totalPopularScore: number;

  @Column()
  type: 'N' | 'P';

  @Column({ type: 'datetime' })
  created: Date;

  @Column({ type: 'datetime', name: 'pp_date' })
  ppdate: Date;
}
