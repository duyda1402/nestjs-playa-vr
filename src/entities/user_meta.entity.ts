import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { UserEntity } from './user.entity';

@Entity({ name: 'wp_rkr3j35p5r_usermeta' })
export class UserMetaEntity {
  @PrimaryGeneratedColumn({ name: 'umeta_id' })
  id: number;

  @Column({ name: 'user_login' })
  userLogin: string;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  @ManyToOne((_T) => UserEntity, (user) => user.userMetas)
  @JoinColumn()
  user_id: UserEntity;

  @Column({ name: 'meta_key' })
  metaKey: string;

  @Column({ type: 'blob', name: 'user_nicename' })
  metaValue: Buffer;
}
