import { Injectable } from '@nestjs/common';
import { launch } from 'puppeteer';
import { LoggingService } from './logging.service';
import { head } from 'lodash';
import { memMonitor } from './utils/memory.utils';
import { MemoryService } from './memory.service';

interface ScrapeJob<T> {
    resolveFn: (value?: T | PromiseLike<T>) => void;
    status: 'QUEUE' | 'PENDING';
    pendingTimestamp: number;
    url: string;
}

const MAX_SIMULTANEOUS_JOBS = 1;
// const MAX_JOB_PENDING_TIME = 5000;

@Injectable()
export class ScraperService {
    queue: Array<ScrapeJob<void>> = [];

    constructor(private loggingService: LoggingService, private memoryService: MemoryService) {
    }

    async getHTML(url: string): Promise<any> {
        // if stuck, then CLEAR // TODO [P. Labus]
        this.loggingService.log('Fetching HTML: LOADING');
        try {
            if (this.memoryService.isMemoryOverloaded()) {
                await this.queueJob(url);
            }
            const html = await this.scrapeHTML(url);
            this.loggingService.log('Fetching HTML: SUCCESS');
            return html;
        } catch (e) {
            this.loggingService.log('Fetching HTML: FAILURE');
            return null;
        } finally {
            this.clearQueueFromJob(url);
        }
    }

    private async scrapeHTML(url): Promise<string> {
        const browser = await launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.90 Safari/537.36');
        await page.goto(url);
        const result = await page.evaluate(() => document.body.innerHTML);
        browser.close();
        return result;
    }

    private clearQueueFromJob(url: string): void {
        this.queue = this.queue.filter((queueJob) => {
            const jobFinished = queueJob.url === url;
            if (jobFinished) {
                this.loggingService.log(`Job finished in: ${ this.getJobTimeToFinishInSeconds(queueJob) } seconds`);
            }
            return !jobFinished;
        });
        this.startNextJob();
    }

    private getJobTimeToFinishInSeconds(job: ScrapeJob<void>): number {
        return (new Date().getTime() - job.pendingTimestamp) / 1000;
    }

    private startNextJob(): void {
        const nextRequest = head(this.queue);
        if (nextRequest) {
            nextRequest.status = 'PENDING';
            nextRequest.pendingTimestamp = new Date().getTime();
            nextRequest.resolveFn();
            // this.handleStuckJob(nextRequest);
        }
    }

    private tryToRunJob(): void {
        if (this.canRunJob()) this.startNextJob();
    }

    private canRunJob(): boolean {
        return this.queue.length <= MAX_SIMULTANEOUS_JOBS;
    }

    // private handleStuckJob(job: ScrapeJob<void>): void {
    //     setTimeout(() => {
    //         const jobFound = this.queue.find((queueJob) => queueJob === job);
    //         if (jobFound) {
    //             this.loggingService.log(`(TIMEOUT) Killing job ( ${ job.url } )`);
    //             jobFound.rejectFn();
    //         }
    //     }, MAX_JOB_PENDING_TIME);
    // }

    private queueJob(url: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const jobIndex = this.queueJob.length;
            this.loggingService.log(`Adding Request to Queue (${ jobIndex })... ( ${ url } )`);
            const job: ScrapeJob<void> = {
                url,
                resolveFn: resolve,
                status: 'QUEUE',
                pendingTimestamp: null,
            };

            this.queue.push(job);
            this.tryToRunJob();
        });
    }
}
