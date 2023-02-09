import { Entity, Column, PrimaryGeneratedColumn, OneToMany, OneToOne } from 'typeorm';
import { TermMetaEntity } from './term_meta.entity';
import { TermTexonomyEntity } from './term_texonomy.entity';
import { TopPornstarsEntity } from './top_pornstar.entity';

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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  @OneToMany((_T) => TermMetaEntity, (tern_meta) => tern_meta.term_id)
  termMetas: TermMetaEntity[];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  @OneToOne((_T) => TermTexonomyEntity, (term_texonomy) => term_texonomy.term_id)
  term_texonomy: TermTexonomyEntity;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  @OneToMany((_T) => TopPornstarsEntity, (top) => top.termId)
  topPorns: TopPornstarsEntity[];
}
