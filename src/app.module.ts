import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ScraperService } from './scraper.service';
import { DatabaseService } from './database.service';
import { LoggingService } from './logging.service';
import { WatcherController } from './watcher.controller';
import { MemoryService } from './memory.service';

@Module({
  imports: [],
  controllers: [AppController, WatcherController],
  providers: [ScraperService, DatabaseService, LoggingService, MemoryService],
})
export class AppModule {
}
