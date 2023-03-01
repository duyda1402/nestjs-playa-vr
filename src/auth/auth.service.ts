import { Injectable } from '@nestjs/common';
import { IFToken, IFRsp } from 'src/types';

import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/shared/user/user.service';
import { AuthFailedException, UnauthorizedException } from 'src/exceptions/auth.exception';
import * as hasher from 'wordpress-hash-node';
@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService, private readonly userService: UserService) {}

  async login(loginDto: { login?: string; password?: string }): Promise<IFRsp<IFToken>> {
    const { login, password } = loginDto;
    // Kiểm tra tính hợp lệ của thông tin đăng nhập
    if (!login || !password) {
      throw new AuthFailedException('Invalid credentials');
    }
    // Tìm kiếm người dùng trong cơ sở dữ liệu
    const user = await this.userService.findUserByUsername([{ userLogin: login }, { userEmail: login }]);
    if (!user) {
      throw new AuthFailedException('Invalid credentials');
    }
    // So sánh mật khẩu
    const isPasswordMatch = this.comparePassword(password, user.password);
    if (!isPasswordMatch) {
      throw new AuthFailedException('Invalid credentials');
    }
    // Tạo token và trả về cho controller
    const payload = { username: user.userLogin, sub: user.id };
    const token = await this.generateToken(payload);
    return { status: { code: 1, message: 'Login successful' }, data: token };
  }

  async refreshToken(token: string): Promise<IFToken> {
    try {
      const playload = await this.jwtService.verifyAsync(token, { secret: 'rt-secret' });
      const user = await this.userService.findUserByUsername({ id: playload['sub'] });
      if (!user) throw new UnauthorizedException();
      const tokenNew = this.generateToken({ sub: user.id, username: user.userLogin });
      // xử lý logic tại đây, ví dụ như lưu token mới trong database.
      return tokenNew;
    } catch (error) {
      throw new UnauthorizedException();
    }
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
