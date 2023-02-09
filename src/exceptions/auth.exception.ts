import { HttpException, HttpStatus } from '@nestjs/common';

export class AuthFailedException extends HttpException {
  constructor(message: string) {
    super(
      {
        status: {
          message: message,
          code: 3,
        },
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class UnauthorizedException extends HttpException {
  constructor() {
    super(
      {
        status: {
          message: 'Unauthorized',
          code: 3,
        },
      },
      HttpStatus.UNAUTHORIZED
    );
  }
}
