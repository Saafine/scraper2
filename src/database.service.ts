import { Injectable } from '@nestjs/common';
import { Connection, createConnection, MysqlError } from 'mysql';
import { LoggingService } from './logging.service';
import { IgnoredSearchResult } from './app.model';

interface IgnoreQueryDef {
  queryHash: string;
  valuesHash: string;
}

const DB_TABLE_IGNORE = 'hashes';
const DB_TABLE_IGNORE_COLUMN_QUERY_HASH = 'queryHashes';
export const DB_TABLE_IGNORE_COLUMN_VALUES_HASH = 'valueHashes';

@Injectable()
export class DatabaseService {
  private connection: Connection;

  constructor(private loggingService: LoggingService) {
    this.connection = this.mysqlConnect();
  }

  private mysqlConnect(): Connection {
    this.loggingService.log('Connecting to database...');
    const PORT = process.env.DATABASE_PORT ? Number(process.env.DATABASE_PORT) : undefined;
    const connection = createConnection({
      host: process.env.DATABASE_HOST || '192.168.99.100',
      user: process.env.DATABASE_USER || 'root',
      password: process.env.DATABASE_PASSWORD || 'password',
      database: process.env.DATABASE_NAME || 'db',
      port: PORT || 3306,
    });
    connection.on('error', (error) => {
      this.loggingService.log<MysqlError>(error);
    });

    connection.on('connect', () => {
      this.loggingService.log('Connected to database');
    });
    return connection;
  }

  ignoreQuery(ignoreQueryDef: IgnoreQueryDef): void {
    const QUERY = `INSERT INTO ${ DB_TABLE_IGNORE } (${ DB_TABLE_IGNORE_COLUMN_QUERY_HASH },
 ${ DB_TABLE_IGNORE_COLUMN_VALUES_HASH }) VALUES ('${ ignoreQueryDef.queryHash }', '${ ignoreQueryDef.valuesHash }')`;
    this.connection.query(QUERY);
  }

  getIgnoredResults(queryHash: string, valuesHashes: string[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      const hashesPreparedForQuery = valuesHashes.map(val => `'${ val }'`).join(',');
      const QUERY = `SELECT \`${ DB_TABLE_IGNORE_COLUMN_VALUES_HASH }\` FROM ${ DB_TABLE_IGNORE }
 WHERE ${ DB_TABLE_IGNORE_COLUMN_VALUES_HASH } IN (${ hashesPreparedForQuery })`;
      this.connection.query(QUERY, (error, results: IgnoredSearchResult[], fields) => {
        if (error) {
          return reject(error);
        }
        resolve(results);
      });
    });
  }
}
