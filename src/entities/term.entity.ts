import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { TermMetaEntity } from './term_meta.entity';

@Entity({ name: 'wp_rkr3j35p5r_terms' })
export class TermEntity {
  @PrimaryGeneratedColumn({ name: 'term_id' })
  id: number;

  @Column()
  name: string;

  @Column()
  slug: string;

  @Column({ name: 'term_group' })
  termGroup: number;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  @OneToMany((type) => TermMetaEntity, (tern_meta) => tern_meta.term_id)
  termMetas: TermMetaEntity[];
}
