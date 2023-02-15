import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'wp_rkr3j35p5r_as3cf_items' })
export class As3cfItemsEntity {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column()
  provider: string;

  @Column()
  region: string;

  @Column()
  bucket: string;

  @Column()
  path: string;

  @Column({ name: 'original_path' })
  originalPath: string;

  @Column({ name: 'is_private', type: 'tinyint' })
  isPrivate: number;

  @Column({ name: 'source_type' })
  sourceType: string;

  @Column({ name: 'source_id' })
  sourceId: number;

  @Column({ name: 'source_path' })
  sourcePath: string;

  @Column({ name: 'original_source_path' })
  originalSourcePath: string;

  @Column({ type: 'blob', name: 'extra_info' })
  extraInfo: Buffer;

  @Column()
  originator: number;

  @Column({ name: 'is_verified' })
  isVerified: number;
}
