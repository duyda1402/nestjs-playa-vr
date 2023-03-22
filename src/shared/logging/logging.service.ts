import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { VideoTrackingEntity } from 'src/entities/video_tracking.entity';

import { Repository } from 'typeorm';
import {VideoService} from "../videos/videos.service";
import {OptionsEntity} from "../../entities/options.entity";
import {AvgStreamTimesEntity} from "../../entities/avg_stream_times.entity";
import {getCurrentTimestamp, parseNumber} from "../../helper";

@Injectable()
export class LoggingService {
  constructor(
    @InjectRepository(VideoTrackingEntity)
    private readonly videoTrackingRepo: Repository<VideoTrackingEntity>,
    @InjectRepository(OptionsEntity)
    private readonly optionRepo: Repository<OptionsEntity>,
    @InjectRepository(AvgStreamTimesEntity)
    private readonly avgStreamTimesRepo: Repository<OptionsEntity>,
    private readonly videoService: VideoService,
  ) {}

  async save(userId, userIp, eventData): Promise<boolean> {
    const postId = eventData.video_id;
    const studio = await this.videoService.getTheTerm(postId, 'studio');
    const category = await this.videoService.getTheTerm(postId, 'category');
    const isDownloadAction = eventData.event_type === 'videoDownloaded';

    if(!studio || !category) {
      return false;
    }

    let duration = 0, durationCapped = 0;

    if(isDownloadAction) {
      if(category.id === 246) {//VR Games
        duration = Number(await this.videoService.getPostMeta(postId, 'game_duration_for_premium', true));
      } else {//VR Videos
        // const studioAvgStreamTimeRow = await this.avgStreamTimesRepo.findOne({where: {studio: studio.slug}, select: ['premDownloadValue'], order: {date: 'DESC'}});
        // if(studioAvgStreamTimeRow) {
        //   duration = studioAvgStreamTimeRow.premDownloadValue;
        // } else {
          const defPremDownloadValue = await this.optionRepo.findOne({where: {name: 'default_prem_download_value'}, select: ['value']});
          duration = parseNumber(defPremDownloadValue?.value);
        // }
      }

      durationCapped = duration;
    } else {
      duration = eventData.duration;

      if(duration < 30) return false;

      durationCapped = Math.min(duration, 900);
    }

    this.videoTrackingRepo.save({
      userId: userId,
      userIp: userIp,
      postId: postId,
      attachmentId: postId,
      attachmentType: eventData.video_quality || null,
      category: category.slug,
      studio: studio.slug,
      studioId: studio.id,
      nfaction: 2,
      loggedIn: 1,
      tags: '[]',
      action: isDownloadAction ? 'download_paid_video' : 'play_video',
      duration: duration,
      cappedDuration: durationCapped,
      userAgent: 'Playa VR',
      timestamp: getCurrentTimestamp()
    });

    return true;
  }
}
