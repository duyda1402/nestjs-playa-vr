import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'wp_rkr3j35p5r_options' })
export class OptionsEntity {
  @PrimaryGeneratedColumn({ name: 'option_id' })
  id: number;
  @Column({ name: 'option_name' })
  name: number;

  @Column({type: 'blob', name: 'option_value' })
  value: string;

  autoload: string;
}
