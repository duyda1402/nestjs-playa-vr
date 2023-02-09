import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn, OneToMany } from 'typeorm';

import { TermEntity } from './term.entity';
import { TermRelationShipsBasicEntity } from './term_relationships_basic.entity';

@Entity({ name: 'wp_rkr3j35p5r_term_taxonomy' })
export class TermTexonomyEntity {
  @PrimaryGeneratedColumn({ name: 'term_taxonomy_id' })
  id: number;

  @Column()
  taxonomy: string;

  @Column({ type: 'blob' })
  description: Buffer;

  @Column()
  parent: number;

  @Column()
  count: number;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  @OneToOne((_T) => TermEntity)
  @JoinColumn()
  term_id: TermEntity;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  @OneToMany((_T) => TermRelationShipsBasicEntity, (termRB) => termRB.termTaxonomyId)
  termRB: TermRelationShipsBasicEntity[];
}
