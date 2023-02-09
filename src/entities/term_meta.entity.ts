import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToOne } from 'typeorm';
import { TermEntity } from './term.entity';
import { TermTexonomyEntity } from './term_texonomy.entity';

@Entity({ name: 'wp_rkr3j35p5r_termmeta' })
export class TermMetaEntity {
  @PrimaryGeneratedColumn({ name: 'meta_id' })
  id: number;

  @Column()
  metaKey: string;

  @Column({ type: 'blob', name: 'term_group' })
  metaValue: Buffer;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  @ManyToOne((type) => TermEntity, (term) => term.termMetas)
  term_id: TermEntity;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  @OneToOne((type) => TermTexonomyEntity, (term_texonomy) => term_texonomy.term_id)
  term_texonomy: TermTexonomyEntity;
}
