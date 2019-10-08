import { Injectable } from '@nestjs/common';

@Injectable()
export class LoggingService {
  log<T>(msg: T | string): void {
    // tslint:disable-next-line:no-console
    console.log(msg);
  }
}
