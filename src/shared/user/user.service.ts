import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../../entities/user.entity';
import { IFUserProfile } from 'src/types';
import { UserMetaEntity } from 'src/entities/user_meta.entity';
import { SubscriptionEntity } from 'src/entities/subscriptions.entity';
import { JwtService } from '@nestjs/jwt';
import { unserialize } from 'php-serialize';

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
    const role = await this.getUserRole(userId);

    return { ...user, role: role };
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
    if (!userid) return 0;
    const userInfo = await this.findUserInfo(userid);
    if (!userInfo) return 0;
    if (userInfo?.role === 'premium') return 2;
    return 1;
    // } catch (err) {
    //   return 0;
    // }
  }

  async getUserRole(userId): Promise<string> {
    let userRole = 'free';

    const sub = await this.subRepository
      .createQueryBuilder('sub')
      .where('sub.userId = :userId', { userId: userId })
      .andWhere('sub.studioId = :studioId', { studioId: 5210 })
      .andWhere('(end_datetime >= NOW() OR end_datetime IS NULL)')
      .select(['sub.userId as id'])
      .getRawOne();

    if (sub && sub.id) {
      userRole = 'premium';
    } else {
      const metaRow = await this.userRepository
        .createQueryBuilder('user')
        .where('user.id = :userId', { userId: userId })
        .leftJoinAndSelect(UserMetaEntity, 'um', 'um.userId = user.id')
        .andWhere('um.metaKey = :metaKey', { metaKey: 'wp_rkr3j35p5r_capabilities' })
        .select(['um.metaValue as `value`'])
        .getRawOne();

      if (metaRow && metaRow.value) {
        const caps = unserialize(metaRow.value);

        if (caps && Object.keys(caps).indexOf('premium-give-away') !== -1) {
          userRole = 'premium';
        }
      }
    }

    return userRole;
  }
}
