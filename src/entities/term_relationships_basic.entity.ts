import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { TermTexonomyEntity } from './term_texonomy.entity';

@Entity({ name: 'wp_rkr3j35p5r_term_relationships_basic' })
export class TermRelationShipsBasicEntity {
  @Column({ name: 'object_id' })
  objectId: number;

  @Column({ name: 'term_oder' })
  termOder: number;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  @ManyToOne((_T) => TermTexonomyEntity, (term) => term.termRB)
  @JoinColumn({ name: 'term_taxonomy_id' })
  termTaxonomyId: TermTexonomyEntity;
}
