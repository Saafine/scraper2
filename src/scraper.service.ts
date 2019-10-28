import { Injectable } from '@nestjs/common';
import { Browser, launch, Page } from 'puppeteer';
import { LoggingService } from './logging.service';
import { head } from 'lodash';
import { MemoryService } from './memory.service';

interface ScrapeJob<T> {
    resolveFn: (value?: T | PromiseLike<T>) => void;
    status: 'QUEUE' | 'PENDING';
    pendingTimestamp: number;
    url: string;
}

const MAX_SIMULTANEOUS_JOBS = 3;
const MIN_SIMULTANEOUS_JOBS = 1;

@Injectable()
export class ScraperService {
    queue: Array<ScrapeJob<void>> = [];
    browser: Browser;
    maxSimultaneousJobs = MAX_SIMULTANEOUS_JOBS;

    // TODO [P. Labus] create queue service
    constructor(private loggingService: LoggingService, private memoryService: MemoryService) {
    }

    async getHTML(url: string): Promise<any> {
        this.setJobLimit();
        // if stuck, then CLEAR // TODO [P. Labus]
        this.loggingService.log('Fetching HTML: LOADING');
        try {
            await this.queueJob(url);
            const html = await this.scrapeHTML(url);
            this.loggingService.log('Fetching HTML: SUCCESS');
            return html;
        } catch (e) {
            this.loggingService.log('Fetching HTML: FAILURE');
            return null;
        } finally {
            this.clearQueueFromJob(url);
            this.finishScraping();
        }
    }

    private async getPage(): Promise<Page> {
        if (this.browser) return await this.browser.newPage();

        this.browser = await launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        this.browser.on('disconnected', () => {
            this.loggingService.log('Browser disconnected');
            this.browser = null;
        });

        return await this.browser.newPage();
    }

    private finishScraping() {
        if (!this.allJobsDone()) return;
        this.loggingService.log('Closing browser');
        this.browser.close();
    }

    private allJobsDone(): boolean {
        return this.queue.length === 0;
    }

    private async scrapeHTML(url): Promise<string> {
        const page = await this.getPage();
        await page.goto(url);
        return await page.evaluate(() => document.body.innerHTML);
    }

    private setJobLimit(): void {
        this.maxSimultaneousJobs = this.memoryService.isMemoryOverloaded() ? MIN_SIMULTANEOUS_JOBS : MAX_SIMULTANEOUS_JOBS;
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
        }
    }

    private tryToRunJob(): void {
        if (this.canRunJob()) this.startNextJob();
    }

    private canRunJob(): boolean {
        return this.queue.length <= this.maxSimultaneousJobs;
    }

    private queueJob(url: string): Promise<void> {
        return new Promise((resolve) => {
            const jobIndex = this.queue.length;
            this.loggingService.log(`Adding Request to Queue (${ jobIndex })...`);
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
