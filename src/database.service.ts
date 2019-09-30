import { Injectable } from '@nestjs/common';

@Injectable()
export class DatabaseService {
  async connect(): Promise<any> {
    return Promise.resolve();
  }

  //     const PORT = process.env.DATABASE_PORT ? Number(process.env.DATABASE_PORT) : undefined;
  //     const connection = createConnection({
  //         host: process.env.DATABASE_HOST || '127.0.0.1',
  //         user: process.env.DATABASE_USER || 'root',
  //         password: process.env.DATABASE_PASSWORD || 'password',
  //         database: process.env.DATABASE_NAME || 'db',
  //         port: PORT || 3306
  //     });
  //     connection.on('error', (error) => {
  //     console.error(error);
  // });
  // connection.connect();
  // return connection;
}
