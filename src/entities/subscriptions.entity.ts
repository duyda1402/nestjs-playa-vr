import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'subscriptions' })
export class SubscriptionEntity {
  @PrimaryGeneratedColumn({ name: 'subscription_id' })
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'studio_id' })
  studioId: string;

  @Column({ type: 'datetime', name: 'start_datetime' })
  startDate: Date;

  @Column({ type: 'datetime', name: 'end_datetime' })
  endDate: Date;

  @Column({ type: 'datetime' })
  created: Date;
  @Column({ type: 'datetime' })
  modified: Date;
}
