import { Entity, Column, PrimaryGeneratedColumn, JoinColumn, ManyToOne } from 'typeorm';
import { TermEntity } from './term.entity';

@Entity({ name: 'top_pornstars' })
export class TopPornstarsEntity {
  @PrimaryGeneratedColumn()
  id: number;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  @ManyToOne((_T) => TermEntity, (term) => term.topPorns)
  @JoinColumn({ name: 'term_id' })
  termId: TermEntity;

  @Column({ unique: true })
  slug: string;

  @Column()
  score: number;

  @Column({ type: 'datetime' })
  created: Date;
}
