import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { TermEntity } from './term.entity';

@Entity({ name: 'wp_rkr3j35p5r_termmeta' })
export class TermMetaEntity {
  @PrimaryGeneratedColumn({ name: 'meta_id' })
  id: number;

  @Column()
  metaKey: string;

  @Column({ type: 'blob', name: 'term_group' })
  metaValue: Buffer;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  @ManyToOne((_T) => TermEntity, (term) => term.termMetas)
  term_id: TermEntity;
}
