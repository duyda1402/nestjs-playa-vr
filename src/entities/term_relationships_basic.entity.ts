import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'wp_rkr3j35p5r_term_relationships_basic' })
export class TermRelationShipsBasicEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'object_id' })
  objectId: number;

  @Column({ name: 'term_taxonomy_id' })
  termId: number;

  @Column({ name: 'term_oder' })
  termOder: number;
}
