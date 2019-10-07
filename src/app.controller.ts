import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
    @Get()
    getVersion(): string {
        return '0.1.0';
    }
}
