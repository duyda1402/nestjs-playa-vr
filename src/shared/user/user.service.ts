import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOneOptions } from 'typeorm';
import { UserEntity } from '../../entities/user.entity';
import { UserProfile } from 'src/types/auth.type';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>
  ) {}
  async getUserProfile(id: number): Promise<UserProfile> {
    const user = await this.findUserByUsername({ id });
    return {
      display_name: user.displayName,
      role: 'premium',
    };
  }

  async findAll(): Promise<UserEntity[]> {
    const pageNumber = 1; //Xét trên trang số 1
    const data = await this.userRepository.find({
      skip: (pageNumber - 1) * 10,
      take: 10, // limit to 10 records\
      where: { userStatus: 0 }, // filter user_status: 0
      order: { userRegistered: 'DESC' }, //sort user_registered: 'DESC'
    });
    return data;
  }

  async findUserByUsername(where: any): Promise<UserEntity | null> {
    const options: FindOneOptions<UserEntity> = {
      where: where,
    };
    const user = await this.userRepository.findOne(options);
    return user;
  }

  async updateUser(id: number, newData: Partial<UserEntity>): Promise<any> {
    return await this.userRepository.update(id, newData);
  }
}
