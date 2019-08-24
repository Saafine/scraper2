import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
    constructor(private readonly appService: AppService) {
    }

    @Get('scrape')
    getHTML(): Promise<Document> {
        return this.appService.getHTML();
    }

    @Get('titles')
    async getTitles(): Promise<string[]> {
        const html = await this.appService
            .getHTML('https://www.gumtree.pl/s-mieszkania-i-domy-sprzedam-i-kupie/warszawa/mieszkanie/v1c9073l3200008a1dwp1?pr=,550000&df=ownr');
        debugger;
        const titles = Array.from(html.querySelectorAll('.tile-title-text')).map((titleNode: HTMLElement) => titleNode.textContent);
        return titles;
    }
}
