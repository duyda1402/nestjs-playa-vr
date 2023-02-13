import { Entity, Column, PrimaryGeneratedColumn, OneToMany, OneToOne } from 'typeorm';
import { TermMetaEntity } from './term_meta.entity';
// import { TermTaxonomyEntity } from './term_taxonomy.entity';
import { TopPornstarsEntity } from './top_pornstar.entity';
import { TermTaxonomyEntity } from './term_taxonomy.entity';

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
  @OneToMany((_T) => TermMetaEntity, (meta) => meta.term)
  metas: TermMetaEntity[];

  //eslint-disable-next-line @typescript-eslint/no-unused-vars
  // @OneToMany((_T) => TermTaxonomyEntity, (texonomy) => texonomy.termId)
  // taxonomys: TermTaxonomyEntity;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  @OneToOne((_T) => TermTaxonomyEntity, (taxonomy) => taxonomy.term)
  taxonomy: TermTaxonomyEntity;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  @OneToMany((_T) => TopPornstarsEntity, (top) => top.termId)
  topPorns: TopPornstarsEntity[];
}
