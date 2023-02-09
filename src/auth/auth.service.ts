import { Injectable } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { Token } from 'src/types/auth.type';
import { Rsp } from 'src/types/response.type';
import { JwtService } from '@nestjs/jwt';
import { verify } from 'jsonwebtoken';
import { UserService } from 'src/shared/user/user.service';
import { AuthFailedException, UnauthorizedException } from 'src/exceptions/auth.exception';
import * as hasher from 'wordpress-hash-node';
@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService, private readonly userService: UserService) {}

  async login(loginDto: LoginDto): Promise<Rsp<Token>> {
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
    const token = this.generateToken(payload);
    return { status: { code: 1, message: 'Login successful' }, data: token };
  }

  async refreshToken(refreshToken: string): Promise<Token> {
    try {
      const payload = verify(refreshToken, 'secretKey');
      const token = this.generateToken({ sub: payload.sub, username: payload['username'] });
      // xử lý logic tại đây, ví dụ như lưu token mới trong database.
      return token;
    } catch (error) {
      throw new UnauthorizedException();
    }
  }

  async validateUser(payload: any) {
    //xử lý logic xác thực người dùng tại đây
    const user = await this.userService.findUserByUsername({ userLogin: payload?.username, id: payload?.sub });
    return user;
  }

  private comparePassword(password: string, hashedPassword: string) {
    const checked = hasher.CheckPassword(password, hashedPassword);
    return checked;
  }

  private generateToken(payload: any): Token {
    const access_token = this.jwtService.sign(payload);
    const refresh_token = this.jwtService.sign(payload, { expiresIn: '7d' });
    return { access_token, refresh_token };
  }
}
