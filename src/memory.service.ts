import { Injectable } from '@nestjs/common';
import { freemem, totalmem } from 'os';

@Injectable()
export class MemoryService {
    isMemoryOverloaded() {
        return this.getMemoryUsage() > 0.8;
    }

    private getMemoryUsage(): number {
        return freemem() / totalmem();
    }
}
