import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../../entities/user.entity';
import { IFUserProfile } from 'src/types';
import { UserMetaEntity } from 'src/entities/user_meta.entity';
import { SubscriptionEntity } from 'src/entities/subscriptions.entity';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class UserService {
  private cache: Map<number, any> = new Map<number, any>();
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(SubscriptionEntity)
    private readonly subRepository: Repository<SubscriptionEntity>,
    private readonly jwtService: JwtService
  ) {}

  async getUserProfile(id: number): Promise<IFUserProfile> {
    const cachedUser = this.cache.get(id);
    if (cachedUser) {
      return {
        display_name: cachedUser.displayName,
        role: cachedUser.role,
      };
    }
    const user = await this.findUserInfo(id);
    this.cache.set(id, user);
    return {
      display_name: user.displayName,
      role: user.role,
    };
  }
  async findUserInfo(userId: number): Promise<any> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    const subPromise = this.subRepository
      .createQueryBuilder('sub')
      .where('sub.userId = :userId', { userId: userId })
      .andWhere('sub.studioId = :studioId', { studioId: userId })
      .getOne();
    const metaPromise = this.userRepository
      .createQueryBuilder('user')
      .where('user.id = :userId', { userId: userId })
      .leftJoinAndSelect(UserMetaEntity, 'um', 'um.userId = user.id')
      .andWhere('um.metaKey = :metaKey', { metaKey: 'wp_rkr3j35p5r_capabilities' })
      .andWhere('um.metaValue LIKE :metaValue', { metaValue: '%premium_member%' })
      .getOne();
    const [sub, metaValue] = await Promise.all([subPromise, metaPromise]);
    if (!sub && !metaValue) return { ...user, role: 'free' };
    if (metaValue) return { ...user, role: 'premium' };
    if (sub && !sub.endDate) return { ...user, role: 'premium' };
    const curDate = new Date(sub.endDate).getTime();
    const nowDate = Date.now();
    if (sub && curDate >= nowDate) return { ...user, role: 'premium' };
    return { ...user, role: 'free' };
  }

  async findUserByUsername(where: any): Promise<UserEntity | null> {
    const user = await this.userRepository.findOne({ where: where });
    return user;
  }

  async updateUser(id: number, newData: Partial<UserEntity>): Promise<any> {
    return await this.userRepository.update(id, newData);
  }

  async getUserLevel(userid: any): Promise<number> {
    // try {
    //   const payload = await this.jwtService.verifyAsync(token, { secret: 'at-secret' });
    //   //User Level: 0: Non-Login, 1: Logged-in, 2: Premium
    const userInfo = await this.findUserInfo(userid);
    if (!userInfo) return 0;
    if (userInfo?.role === 'premium') return 2;
    return 1;
    // } catch (err) {
    //   return 0;
    // }
  }
}
