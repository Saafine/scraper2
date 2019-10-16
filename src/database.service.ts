import { Injectable } from '@nestjs/common';
import { Connection, createConnection, MysqlError } from 'mysql';
import { LoggingService } from './logging.service';
import { IgnoredSearchResult } from './app.model';
import { last } from 'lodash';

interface IgnoreQueryDef {
  queryHash: string;
  valuesHash: string;
}

const ACCEPTABLE_DB_RECONNECT_DELAY = 1000 * 60 * 5;
const DB_TABLE_IGNORE = 'hashes';
const DB_TABLE_IGNORE_COLUMN_QUERY_HASH = 'queryHashes';
export const DB_TABLE_IGNORE_COLUMN_VALUES_HASH = 'valueHashes';

@Injectable()
export class DatabaseService {
  private connection: Connection;
  private errorTimestamps: number[] = [];

  constructor(private loggingService: LoggingService) {
    this.setConnection();
    this.setupConnectionWatchers();
  }

  private setupConnectionWatchers(): void {
    this.connection.on('error', (error) => {
      this.loggingService.log<MysqlError>(error);
      this.tryReconnect();
    });

    this.connection.on('connect', () => {
      this.loggingService.log('Connected to database');
    });
  }

  private setConnection(): void {
    this.loggingService.log('Connecting to database...');
    const PORT = process.env.DATABASE_PORT ? Number(process.env.DATABASE_PORT) : undefined;
    this.connection = createConnection({
      host: process.env.DATABASE_HOST || '127.0.0.1',
      user: process.env.DATABASE_USER || 'root',
      password: process.env.DATABASE_PASSWORD || 'password',
      database: process.env.DATABASE_NAME || 'db',
      port: PORT || 3306,
    });
  }

  private tryReconnect(): void {
    this.loggingService.log('Trying to reconnect to database');
    const lastErrorTimestamp = last(this.errorTimestamps) || 0;
    const msToPreviousError = new Date().getTime() - lastErrorTimestamp;

    if (msToPreviousError <= ACCEPTABLE_DB_RECONNECT_DELAY) {
      this.loggingService.log('Stopping reconnecting, too frequent retries');
      return;
    }

    this.setConnection();
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
