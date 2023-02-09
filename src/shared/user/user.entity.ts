import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'wp_rkr3j35p5r_users' })
export class UserEntity {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'user_login' })
  userLogin: string;

  // @Column({ select: false, name: 'user_pass' })
  @Column({ name: 'user_pass' })
  password: string;

  @Column({ name: 'user_email' })
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
}
