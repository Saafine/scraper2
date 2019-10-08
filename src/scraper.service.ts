/* tslint:disable */
import { Injectable } from '@nestjs/common';
import { launch } from 'puppeteer';
import { LoggingService } from './logging.service';

@Injectable()
export class ScraperService {
  constructor(private loggingService: LoggingService) {
  }

  async getHTML(url: string): Promise<any> {
    if (!url) {
      return null;
    }
    this.loggingService.log('Fetching HTML: LOADING');

    const browser = await launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.90 Safari/537.36');
    await page.goto(url);
    const result = await page.evaluate(() => document.body.innerHTML);
    browser.close();

    this.loggingService.log('Fetching HTML: SUCCESS');
    return result;
  }
}
