import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'avg_stream_times' })
export class AvgStreamTimesEntity {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column()
  studio: string;

  @Column({ name: 'stream_date' })
  date: Date;

  @Column({ name: 'prem_download_value' })
  premDownloadValue: number;

  @Column({ name: 'free_download_value' })
  freeDownloadValue: number;
}
