import { Body, Controller, Post } from '@nestjs/common';
import { LoggingService } from './logging.service';
import { ScraperService } from './scraper.service';
import { JSDOM } from 'jsdom';

interface WatchItem {
  label: string;
  selector: string;
  readMethod: string;
  useAsUniqueId?: boolean;
}

interface WatchDTO {
  url: string;
  items: WatchItem[];
}

// interface ExtractedItem {
//   label: string;
//   values: any[];
// }

@Controller('watch')
export class WatcherController {
  constructor(private logger: LoggingService, private scraperService: ScraperService) {
  }

  @Post()
  async watch(@Body() watch) {
    const html = await this.scraperService.getHTML(watch.url);
    const document = new JSDOM(html).window.document;
    return this.extractWatchedItems(document, watch.items);
  }

  // TODO [P. Labus] type, split into smaller functions and test
  private extractWatchedItems(doc: Document, items: WatchItem[]) {
    const extractedValues: any[][] = items
      .map(({ selector, readMethod }) =>
        Array.from(doc.querySelectorAll(selector))
          .map((element) => element && element[readMethod]));
    const labels = items.map((item) => item.label);
    return [
      labels,
      extractedValues.map((value, index) => {
        return extractedValues.map((aaaa) => aaaa[index]);
      }),
    ];
  }
}
