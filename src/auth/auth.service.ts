import { Injectable } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { Token } from 'src/types/auth.type';
import { Rsp } from 'src/types/response.type';

@Injectable()
export class AuthService {
  async login(loginDto: LoginDto): Promise<Rsp<Token>> {
    const { username, password } = loginDto;

    // Kiểm tra tính hợp lệ của thông tin đăng nhập
    if (!username || !password) {
      return {
        status: { code: 1, message: 'Username and password are required.' },
      };
    }

    // Tìm kiếm người dùng trong cơ sở dữ liệu
    const user = await this.findUserByUsername(username);
    if (!user) {
      return { status: { code: 1, message: 'User not found.' } };
    }

    // So sánh mật khẩu
    const isPasswordMatch = await this.comparePassword(password, user.password);
    if (!isPasswordMatch) {
      return { status: { code: 1, message: 'Incorrect password.' } };
    }

    // Tạo token và trả về cho controller
    const token = this.generateToken(user);
    return { status: { code: 0, message: 'Login successful.' }, data: token };
  }

  private async findUserByUsername(username: string) {
    // Tìm kiếm người dùng trong cơ sở dữ liệu
    return { password: 'Abcd1234@' };
  }

  private async comparePassword(password: string, hashedPassword: string) {
    // So sánh mật khẩu
    return password === hashedPassword;
  }

  private generateToken(user: any): Token {
    // Tạo token
    return {
      access_token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
      refresh_token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MTIzMn0.vqViWSOyJH-ARvFLYu9dN1G7z3wtVJkzs-Ymsut1VPw',
    };
  }
}
