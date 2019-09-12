import { Body, Controller, Get, Post } from '@nestjs/common';
import { JSDOM } from 'jsdom';
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
    private connection: Connection;

    constructor(private readonly gumtreeScraperService: GumtreeScraperService, private readonly scraperService: ScraperService) {
    }

    @Get()
    getStatus(): string {
        return 'ok: 3';
    }

    @Get('init')
    init() {
        this.connection = this.mysqlConnect();
    }

    @Get('new')
    async getTitles(): Promise<Estate[]> {
        console.log('Fetching HTML: LOADING');
        const html = await this.scraperService
            .getHTML('https://www.gumtree.pl/s-mieszkania-i-domy-sprzedam-i-kupie/warszawa/mieszkanie/v1c9073l3200008a1dwp1?pr=,550000&df=ownr');
        console.log('Fetching HTML: SUCCESS');
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
        const PORT = process.env.DATABASE_PORT ? Number(process.env.DATABASE_PORT) : undefined;
        const connection = createConnection({
            host: process.env.DATABASE_HOST || '127.0.0.1',
            user: process.env.DATABASE_USER || 'root',
            password: process.env.DATABASE_PASSWORD || 'password',
            database: process.env.DATABASE_NAME || 'db',
            port: PORT || 3306
        });
        connection.on('error', (error) => {
            console.error(error);
        });
        connection.connect();
        return connection;
    }

    // 1. get newest titles + urls
    // 2. check which one of these doesnt exist in database
    // 3. if new one appeared, inform used
}
