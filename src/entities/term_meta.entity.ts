import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { TermEntity } from './term.entity';

@Entity({ name: 'wp_rkr3j35p5r_termmeta' })
export class TermMetaEntity {
  @PrimaryGeneratedColumn({ name: 'meta_id' })
  id: number;

  @Column({ name: 'meta_key' })
  metaKey: string;

  @Column({ type: 'blob', name: 'meta_value' })
  metaValue: Buffer;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  @ManyToOne((_T) => TermEntity, (term) => term.termMetas)
  @JoinColumn({ name: 'term_id' })
  term: TermEntity;
}
