import { Body, Controller, Get, Post } from '@nestjs/common';
import { JSDOM } from 'jsdom';
import { GUMTREE_MOCK } from './gumtree.mock';
import { Connection, createConnection } from 'mysql';
import { GumtreeScraperService } from './gumtree.service';
import { ScraperService } from './scraper.service';

// TODO [P. Labus] this one is copied in frontend
export interface Estate {
    url: string;
    title: string;
}

@Controller()
export class AppController {
    private connection: Connection = this.mysqlConnect();

    constructor(private readonly gumtreeScraperService: GumtreeScraperService, private readonly scraperService: ScraperService) {
    }

    @Get()
    getStatus(): 'ok' {
        return 'ok';
    }

    @Get('new')
    async getTitles(): Promise<Estate[]> {
        const html = await this.scraperService
            .getHTML('https://www.gumtree.pl/s-mieszkania-i-domy-sprzedam-i-kupie/warszawa/mieszkanie/v1c9073l3200008a1dwp1?pr=,550000&df=ownr');
        // const html = GUMTREE_MOCK;
        const doc = new JSDOM(html).window.document;
        const estates = this.gumtreeScraperService.scrapeEstates(doc); // TODO [P. Labus] call scraper service instead
        const newEstates = await this.getNewEstates(estates);
        // this.updateEstateDb(newEstates);
        return newEstates;
    }

    @Post('mark')
    markAsSeen(@Body() estate: Estate): void {
        this.connection.query(`INSERT INTO estates (url, title) VALUES ('${ estate.url }', '${ estate.title }')`);
    }

    // private updateEstateDb(estates: Estate[]): void {
    //     estates.forEach((estate) => {
    //         this.connection.query(`INSERT INTO estates (url, title) VALUES ('${ estate.url }', '${ estate.title }')`);
    //     });
    // }

    private async getNewEstates(estates: Estate[]): Promise<Estate[]> {
        const newEstates: Estate[] = [];
        for (const estate of estates) {
            const isRegistered = await this.checkIfEstateAlreadyRegistered(estate);
            if (!isRegistered) {
                newEstates.push(estate);
            }
        }
        return newEstates;
    }

    private checkIfEstateAlreadyRegistered(estate: Estate): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.connection.query(`SELECT * from estates WHERE title = '${ estate.title }'`, (error, results, fields) => {
                if (error) {
                    return reject(error);
                }

                resolve(results.length !== 0);
            });
        });
    }

    private mysqlConnect(): Connection {
        const connection = createConnection({
            host: process.env.DATABASE_HOST || '127.0.0.1',
            user: 'root',
            password: 'password',
            database: 'db',
            port: 3306,
        });

        connection.connect();

        return connection;
        // connection.end();
    }

    // 1. get newest titles + urls
    // 2. check which one of these doesnt exist in database
    // 3. if new one appeared, inform used
}