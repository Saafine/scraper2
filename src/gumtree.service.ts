import { Injectable } from '@nestjs/common';
import { Estate } from './app.controller';
import { zip } from 'lodash';

@Injectable()
export class GumtreeScraperService {
    scrapeEstates(document: Document): Estate[] {
        const titles = Array.from(document.querySelectorAll('.view .tile-title-text'))
            .map((titleNode: HTMLAnchorElement) => titleNode.textContent);
        const links = Array.from(document.querySelectorAll('.view .tile-title-text'))
            .map((titleNode: HTMLAnchorElement) => 'https://www.gumtree.pl' + titleNode.href);
        const estatesZipped = zip(titles, links);
        return estatesZipped.reduce((acc, [title, url]) => {
            return [...acc, {
                title,
                url,
            }];
        }, []);
    }
}
