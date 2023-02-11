import { Injectable } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { IFToken, IFRsp } from 'src/types';

import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/shared/user/user.service';
import { AuthFailedException, UnauthorizedException } from 'src/exceptions/auth.exception';
import * as hasher from 'wordpress-hash-node';
@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService, private readonly userService: UserService) {}

  async login(loginDto: LoginDto): Promise<IFRsp<IFToken>> {
    const { username, password } = loginDto;
    // Kiểm tra tính hợp lệ của thông tin đăng nhập
    if (!username || !password) {
      throw new AuthFailedException('Username and password are required');
    }
    // Tìm kiếm người dùng trong cơ sở dữ liệu
    const user = await this.userService.findUserByUsername({ userLogin: username });
    if (!user) {
      throw new AuthFailedException('Incorrect username/password');
    }
    // So sánh mật khẩu
    const isPasswordMatch = await this.comparePassword(password, user.password);
    if (!isPasswordMatch) {
      throw new AuthFailedException('Incorrect username/password');
    }
    // Tạo token và trả về cho controller
    const payload = { username: user.userLogin, sub: user.id };
    const token = await this.generateToken(payload);
    return { status: { code: 1, message: 'Login successful' }, data: token };
  }

  async refreshToken(id: number): Promise<IFToken> {
    const user = await this.userService.findUserByUsername({ id: id });
    if (!user) throw new UnauthorizedException();
    const token = this.generateToken({ sub: user.id, username: user.userLogin });
    // xử lý logic tại đây, ví dụ như lưu token mới trong database.
    return token;
  }

  async validateUser(id: number) {
    //xử lý logic xác thực người dùng tại đây
    const user = await this.userService.findUserByUsername({ id: id });
    return user;
  }

  private comparePassword(password: string, hashedPassword: string) {
    const checked = hasher.CheckPassword(password, hashedPassword);
    return checked;
  }

  private async generateToken(payload: any): Promise<IFToken> {
    const access_token = await this.jwtService.signAsync(payload, { secret: 'at-secret', expiresIn: '15m' });
    const refresh_token = await this.jwtService.signAsync(payload, { secret: 'rt-secret', expiresIn: '7d' });
    return { access_token, refresh_token };
  }
}
