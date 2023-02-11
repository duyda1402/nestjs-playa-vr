import { Entity, Column, PrimaryGeneratedColumn, OneToMany, JoinColumn, ManyToOne, OneToOne } from 'typeorm';

// import { TermEntity } from './term.entity';
import { TermRelationShipsBasicEntity } from './term_relationships_basic.entity';
import { TermEntity } from './term.entity';

@Entity({ name: 'wp_rkr3j35p5r_term_taxonomy' })
export class TermTaxonomyEntity {
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
  // @ManyToOne((_T) => TermEntity, (term) => term.taxonomys)

  // termId: TermEntity;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  @OneToOne((_T) => TermEntity, (term) => term.taxonomy)
  @JoinColumn({ name: 'term_id' })
  term: TermEntity;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  @OneToMany((_T) => TermRelationShipsBasicEntity, (termRB) => termRB.termTaxonomyId)
  termRB: TermRelationShipsBasicEntity[];
}
