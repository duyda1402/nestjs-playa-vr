import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity as User } from './user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  async findAll(): Promise<User[]> {
    const pageNumber = 1; //Xét trên trang số 1
    const data = await this.userRepository.find({
      skip: (pageNumber - 1) * 10,
      take: 10, // limit to 10 records\
      where: { userStatus: 0 }, // filter user_status: 0
      order: { userRegistered: 'DESC' }, //sort user_registered: 'DESC'
    });

    return data;
  }
  async updateUser(id: number, newData: Partial<User>): Promise<any> {
    return await this.userRepository.update(id, newData);
  }
}
