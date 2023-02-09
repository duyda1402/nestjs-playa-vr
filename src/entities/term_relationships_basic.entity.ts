import { Entity, Column, ManyToOne, JoinColumn, PrimaryGeneratedColumn } from 'typeorm';
import { TermTaxonomyEntity } from './term_taxonomy.entity';

@Entity({ name: 'wp_rkr3j35p5r_term_relationships_basic' })
export class TermRelationShipsBasicEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'object_id' })
  objectId: number;

  @Column({ name: 'term_oder' })
  termOder: number;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  @ManyToOne((_T) => TermTaxonomyEntity, (term) => term.termRB)
  @JoinColumn({ name: 'term_taxonomy_id' })
  termTaxonomyId: TermTaxonomyEntity;
}
