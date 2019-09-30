import { Injectable } from '@nestjs/common';

@Injectable()
export class LoggingService {
  log(msg: string): void {
    // tslint:disable-next-line:no-console
    console.log(msg);
  }
}
