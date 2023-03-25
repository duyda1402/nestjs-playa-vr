import {Controller, Put, Ip, UseGuards, Body, Req} from '@nestjs/common';

import {IFRsp} from 'src/types/response.type';

import { LoggingService } from './logging.service';
import {JwtAuthGuard} from "../../auth/auth.guard";
import {LoggingData} from "../../types";
import {Request} from "express";
import {CommonService} from "../common/common.service";

@Controller('')
export class LoggingController {
  constructor(
      private readonly loggingService: LoggingService,
      private readonly commonService: CommonService
  ) {}

  @Put('/event')
  @UseGuards(JwtAuthGuard)
  async save(@Req() request: Request, @Ip() userIp, @Body() data: LoggingData): Promise<IFRsp<any>> {
    const isPremiumUser = request.user && request.user['role'] === 'premium';

    if(isPremiumUser) {
      const hasPremiumContent = await this.commonService.hasPremiumContent(Number(data.video_id));

      if(hasPremiumContent) {
        const result = await this.loggingService.save(request.user['sub'], userIp, data);

        return {status: {code: result ? 1 : 0}};
      }
    }

    return {status: {code: 0}};
  }
}
