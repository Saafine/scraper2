import { Injectable } from '@nestjs/common';
import { launch } from 'puppeteer';
import { LoggingService } from './logging.service';

@Injectable()
export class ScraperService {
  constructor(private loggingService: LoggingService) {
  }

  async getHTML(url: string = 'https://google.com'): Promise<any> {
    this.loggingService.log('Fetching HTML: LOADING');

    const browser = await launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.goto(url);
    const result = await page.evaluate(() => document.body.innerHTML);
    browser.close();

    this.loggingService.log('Fetching HTML: SUCCESS');
    return result;
  }
}
