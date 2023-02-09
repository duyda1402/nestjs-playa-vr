import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { UserMetaEntity } from './user_meta.entity';
import { PostEntity } from './post.entity';

@Entity({ name: 'wp_rkr3j35p5r_users' })
export class UserEntity {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'user_login', unique: true })
  userLogin: string;

  // @Column({ select: false, name: 'user_pass' })
  @Column({ name: 'user_pass' })
  password: string;

  @Column({ name: 'user_email', unique: true })
  userEmail: string;

  @Column({ name: 'user_nicename' })
  userNicename: string;

  @Column({ name: 'user_url' })
  userUrl: string;

  @Column({ type: 'datetime', name: 'user_registered' })
  userRegistered: Date;

  @Column({ name: 'user_activation_key' })
  userActivationKey: string;

  @Column({ name: 'user_status' })
  userStatus: number;

  @Column({ name: 'display_name' })
  displayName: string;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  @OneToMany((_T) => UserMetaEntity, (userMeta) => userMeta.user_id)
  userMetas: UserMetaEntity[];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  @OneToMany((_T) => PostEntity, (post) => post.postAuthor)
  posts: PostEntity[];
}
