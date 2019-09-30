import { Body, Controller, Get, Post } from '@nestjs/common';

@Controller()
export class AppController {

  @Get()
  getVersion(): string {
    return '4';
  }

  @Get('connect')
  init() {
    // this.connection = this.mysqlConnect();
  }


  // @Post('test')
  // markAsSeen(@Body() aa): void {
  //   console.log(aa);
  // }

  // @Post('mark')
  // markAsSeen(@Body() estate: Estate): void {
  //     this.connection.query(`INSERT INTO estates (url, title) VALUES ('${ estate.url }', '${ estate.title }')`);
  // }

  // private updateEstateDb(estates: Estate[]): void {
  //     estates.forEach((estate) => {
  //         this.connection.query(`INSERT INTO estates (url, title) VALUES ('${ estate.url }', '${ estate.title }')`);
  //     });
  // }

  // private async getNewEstates(estates: Estate[]): Promise<Estate[]> {
  //     const newEstates: Estate[] = [];
  //     for (const estate of estates) {
  //         const isRegistered = await this.checkIfEstateAlreadyRegistered(estate);
  //         if (!isRegistered) {
  //             newEstates.push(estate);
  //         }
  //     }
  //     return newEstates;
  // }

  // private checkIfEstateAlreadyRegistered(estate: Estate): Promise<boolean> {
  //     return new Promise((resolve, reject) => {
  //         this.connection.query(`SELECT * from estates WHERE title = '${ estate.title }'`, (error, results, fields) => {
  //             if (error) {
  //                 return reject(error);
  //             }
  //
  //             resolve(results.length !== 0);
  //         });
  //     });
  // }

  // private mysqlConnect(): Connection {
  //
  // }

}
