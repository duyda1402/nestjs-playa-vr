import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
// import { UserEntity } from './user.entity';

@Entity({ name: 'wp_rkr3j35p5r_usermeta' })
export class UserMetaEntity {
  @PrimaryGeneratedColumn({ name: 'umeta_id' })
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'meta_key' })
  metaKey: string;

  @Column({ type: 'blob', name: 'meta_value' })
  metaValue: Buffer;
}
