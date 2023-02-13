import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'wp_rkr3j35p5r_terms' })
export class TermEntity {
  @PrimaryGeneratedColumn({ name: 'term_id' })
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ name: 'term_group' })
  termGroup: number;
}
