import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'wp_rkr3j35p5r_term_taxonomy' })
export class TermTaxonomyEntity {
  @PrimaryGeneratedColumn({ name: 'term_taxonomy_id' })
  id: number;

  @Column({ name: 'term_id' })
  termId: number;

  @Column({ select: true })
  taxonomy: string;

  @Column({ type: 'blob' })
  description: Buffer;

  @Column()
  parent: number;

  @Column()
  count: number;
}
