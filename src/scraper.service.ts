import { Injectable } from '@nestjs/common';
import { launch } from 'puppeteer';

@Injectable()
export class ScraperService {
    async getHTML(url: string = 'https://google.com'): Promise<any> {
        const browser = await launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
        const page = await browser.newPage();
        await page.goto(url);
        const result = await page.evaluate(() => document.body.innerHTML);
        browser.close();
        return result;
    }
}
