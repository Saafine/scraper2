/* tslint:disable:curly */
import { Body, Controller, Post } from '@nestjs/common';
import { JSDOM } from 'jsdom';
import { zip } from 'lodash';
import { getHashFromObj } from './utils/hashing.utils';
import { GUMTREE_MOCK } from './mocks/gumtree.mock';
import { DatabaseService } from './database.service';
import { QueryConfigurationValue, QuerySearchIgnoreDTO, QuerySearchResponse, WatchDTO } from './app.models';

// TODO [P. Labus] some of these methods could be moved out from controller
@Controller('watch')
export class WatcherController {
    constructor(private databaseService: DatabaseService) {
    }

    @Post()
    async watch(@Body() watch: WatchDTO) { // TODO [P. Labus] return type
        // const html = await this.scraperService.getHTML(watch.url);
        const html = GUMTREE_MOCK;
        const document = new JSDOM(html).window.document;
        return await this.extractWatchedItems(document, watch);
    }

    @Post('ignore')
    ignoreByValue(@Body() ignoreQueryDTO: QuerySearchIgnoreDTO) {
        const valuesHash = getHashFromObj(ignoreQueryDTO && ignoreQueryDTO.values);
        if (!valuesHash) return;
        this.databaseService.ignoreQuery({
            queryHash: ignoreQueryDTO.queryHash,
            valuesHash,
        });
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

    // TODO [P. Labus] could be improved
    private async removeIgnoredValues(queryHash: string, values: QueryConfigurationValue[] = []): Promise<QueryConfigurationValue[]> {
        const valuesWithHash: Array<{ value: QueryConfigurationValue; hash: string }> = values.map((value) => {
            return {
                value,
                hash: getHashFromObj(value),
            };
        });

        const unignoredValues: QueryConfigurationValue[] = [];

        for (const valueWithHash of valuesWithHash) {
            const isIgnored = await this.databaseService.isQueryIgnored(queryHash, valueWithHash.hash);
            if (!isIgnored) {
                unignoredValues.push(valueWithHash.value);
            }
        }
        return unignoredValues;
    }

    private getValuesFromDocument({ url, items }: WatchDTO, doc): any[][] {
        return items
            .map(({ selector, readMethod }) =>
                Array.from(doc.querySelectorAll(selector))
                    .map((element) => {
                        if (!element) return null;
                        if (readMethod === 'href') return this.getUrlFromElement(element as HTMLAnchorElement, url);
                        return element[readMethod];
                    }));
    }

    private getUrlFromElement(element: HTMLAnchorElement, url: string = ''): string {
        const value = element && element.href;
        if (typeof value !== 'string') return null;
        if (value.startsWith('/')) {
            const { origin } = new URL(url);
            return origin + value;
        }
        return value;
    }
}
