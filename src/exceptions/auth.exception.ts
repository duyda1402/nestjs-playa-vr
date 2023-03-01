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
      HttpStatus.OK
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
      HttpStatus.OK
    );
  }
}

export class SuccessExceptionxtends extends HttpException {
  constructor(data?: any) {
    super(
      {
        status: {
          code: 1,
          message: 'successful',
        },
        data: data,
      },
      HttpStatus.OK
    );
  }
}
