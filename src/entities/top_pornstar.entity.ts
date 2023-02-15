import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
// import { TermEntity } from './term.entity';

@Entity({ name: 'top_pornstars' })
export class TopPornstarsEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  slug: string;

  @Column()
  score: number;

  @Column({ type: 'datetime' })
  created: Date;

  // @ManyToOne((_T) => TermEntity, (term) => term.topPorns)
  // @JoinColumn({ name: 'term_id' })
  // termId: TermEntity;
}