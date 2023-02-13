import { HttpException, HttpStatus } from '@nestjs/common';

export class DataNotFoundException extends HttpException {
  constructor(message: string) {
    super(
      {
        status: {
          message: message,
          code: 3,
        },
      },
      HttpStatus.NOT_FOUND
    );
  }
}
