import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { GumtreeScraperService } from './gumtree.service';
import { ScraperService } from './scraper.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [GumtreeScraperService, ScraperService],
})
export class AppModule {}
