/* tslint:disable:curly */
import { Body, Controller, Post } from '@nestjs/common';
import { JSDOM } from 'jsdom';
import { zip } from 'lodash';
import { getHashFromObj } from './utils/hashing.utils';
import { GUMTREE_MOCK } from './mocks/gumtree.mock';
import { DatabaseService, DB_TABLE_IGNORE_COLUMN_VALUES_HASH } from './database.service';
import { IgnoredSearchResult, QueryConfigurationValue, QuerySearchIgnoreDTO, QuerySearchResponse, WatchDTO } from './app.model';
import { ScraperService } from './scraper.service';

// TODO [P. Labus] some of these methods could be moved out from controller
@Controller('watch')
export class WatcherController {
  constructor(private databaseService: DatabaseService, private scraperService: ScraperService) {
  }

  @Post()
  async watch(@Body() watch: WatchDTO) { // TODO [P. Labus] return type
    const html = await this.scraperService.getHTML(watch.url);
    // const html = GUMTREE_MOCK;
    const document = new JSDOM(html).window.document;
    return await this.extractWatchedItems(document, watch);
  }

  @Post('ignore')
  ignoreByValue(@Body() ignoreQueryDTO: QuerySearchIgnoreDTO) {
    const valuesHash = getHashFromObj(ignoreQueryDTO && ignoreQueryDTO.values);
    if (!valuesHash) {
      return;
    }
    const ignoreQuery = {
      queryHash: ignoreQueryDTO.queryHash,
      valuesHash,
    };
    this.databaseService.ignoreQuery(ignoreQuery);
    return ignoreQuery;
  }

  private async extractWatchedItems(doc: Document, queryConfiguration: WatchDTO): Promise<QuerySearchResponse> {
    const extractedValues = this.getValuesFromDocument(queryConfiguration, doc);
    const labels = queryConfiguration.items.map((item) => item.label);
    const zippedValues: QueryConfigurationValue[] = zip(...extractedValues);
    const queryHash = getHashFromObj(queryConfiguration);
    const unIgnoredValues = await this.removeIgnoredValues(queryHash, zippedValues);
    return {
      queryHash,
      data: {
        labels,
        values: unIgnoredValues,
      },
    };
  }

  private async removeIgnoredValues(queryHash: string, values: QueryConfigurationValue[] = []): Promise<QueryConfigurationValue[]> {
    const valuesWithHash: string[] = values.map((value) => getHashFromObj(value));
    const ignoredResults: IgnoredSearchResult[] = await this.databaseService.getIgnoredResults(queryHash, valuesWithHash);
    const ignoredHashes = ignoredResults.reduce((acc, result: IgnoredSearchResult) => {
      return {
        ...acc,
        [result[DB_TABLE_IGNORE_COLUMN_VALUES_HASH]]: true,
      };
    }, {});

    return valuesWithHash.reduce((acc, hash: string, index) => {
      if (!ignoredHashes[hash]) {
        acc.push(values[index]);
      }
      return acc;
    }, []);
  }

  private getValuesFromDocument({ url, items }: WatchDTO, doc): any[][] {
    return items
      .map(({ selector, readMethod }) =>
        Array.from(doc.querySelectorAll(selector))
          .map((element) => {
            if (!element) {
              return null;
            }
            if (readMethod === 'href') {
              return this.getUrlFromElement(element as HTMLAnchorElement, url);
            }
            return element[readMethod];
          }));
  }

  private getUrlFromElement(element: HTMLAnchorElement, url: string = ''): string {
    const value = element && element.href;
    if (typeof value !== 'string') {
      return null;
    }
    if (value.startsWith('/')) {
      const { origin } = new URL(url);
      return origin + value;
    }
    return value;
  }
}
