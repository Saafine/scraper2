import { Injectable } from '@nestjs/common';

@Injectable()
export class LoggingService {
  // TODO [P. Labus] change to parmas: tags: string[], msg
  // logerFactory => (tags) => log(tags, msg);
  log<T>(msg: T | string): void {
    // tslint:disable-next-line:no-console
    console.log(msg);
  }
}
