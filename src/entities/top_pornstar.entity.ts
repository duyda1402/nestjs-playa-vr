import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
// import { TermEntity } from './term.entity';

@Entity({ name: 'top_pornstars' })
export class TopPornstarsEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'term_id' })
  termId: number;

  @Column()
  slug: string;

  @Column()
  score: number;

  @Column({ type: 'datetime' })
  created: Date;
}
