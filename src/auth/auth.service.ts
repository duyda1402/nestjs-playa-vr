import { Injectable } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { Token } from 'src/types/auth.type';
import { Rsp } from 'src/types/response.type';
import { JwtService } from '@nestjs/jwt';
import { sign, verify } from 'jsonwebtoken';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async login(loginDto: LoginDto): Promise<Rsp<Token>> {
    const { username, password } = loginDto;

    // Kiểm tra tính hợp lệ của thông tin đăng nhập
    if (!username || !password) {
      return {
        status: { code: 2, message: 'Username and password are required' },
      };
    }

    // Tìm kiếm người dùng trong cơ sở dữ liệu
    const user = await this.findUserByUsername(username);
    if (!user) {
      return { status: { code: 2, message: 'User not found' } };
    }

    // So sánh mật khẩu
    const isPasswordMatch = await this.comparePassword(password, user.password);
    if (!isPasswordMatch) {
      return { status: { code: 2, message: 'Incorrect password' } };
    }
    const payload = { username: user.username, sub: 14 };
    // Tạo token và trả về cho controller
    const token = this.generateToken(payload);
    return { status: { code: 1, message: 'Login successful' }, data: token };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = verify(refreshToken, 'secretKey');

      // if (payload.type !== 'refresh') {
      //   throw new Error('Invalid token');
      // }

      // const newAccessToken = sign({ sub: payload.sub, username: payload['username'] }, 'secretKey', {
      //   expiresIn: '15m',
      // });
      const token = this.generateToken({ sub: payload.sub, username: payload['username'] });
      return token;
    } catch (error) {
      throw error;
    }
  }

  async validateUser(payload: any) {
    return { userId: payload?.sub, username: payload?.username };
  }

  private async findUserByUsername(username: string) {
    // Tìm kiếm người dùng trong cơ sở dữ liệu
    return { username: 'username', password: 'Abcd1234@' };
  }

  private async comparePassword(password: string, hashedPassword: string) {
    // So sánh mật khẩu
    return password === hashedPassword;
  }

  private generateToken(payload: any): Token {
    const access_token = this.jwtService.sign(payload);
    const refresh_token = this.jwtService.sign(payload, { expiresIn: '7d' });
    return { access_token, refresh_token };
  }
}
