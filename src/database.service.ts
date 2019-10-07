import { Injectable } from '@nestjs/common';
import { Connection, createConnection } from 'mysql';
import { LoggingService } from './logging.service';

interface IgnoreQueryDef {
    queryHash: string;
    valuesHash: string;
}

const DB_TABLE_IGNORE = 'ignore'; // TODO [P. Labus] possible rename to hashes (query, values inside)
const DB_TABLE_IGNORE_COLUMN_QUERY_HASH = 'queryHash';
const DB_TABLE_IGNORE_COLUMN_VALUES_HASH = 'valuesHash';

@Injectable()
export class DatabaseService {
    private connection: Connection;

    constructor(private loggingService: LoggingService) {
    }

    private mysqlConnect(): Connection {
        this.loggingService.log('Connecting to database...');
        const PORT = process.env.DATABASE_PORT ? Number(process.env.DATABASE_PORT) : undefined;
        const connection = createConnection({
            host: process.env.DATABASE_HOST || '127.0.0.1',
            user: process.env.DATABASE_USER || 'root',
            password: process.env.DATABASE_PASSWORD || 'password',
            database: process.env.DATABASE_NAME || 'db',
            port: PORT || 3306,
        });
        connection.on('error', (error) => {
            this.loggingService.log(error);
        });
        connection.connect();
        return connection;
    }

    ignoreQuery(ignoreQueryDef: IgnoreQueryDef): void {
        this.connection.query(
            // tslint:disable-next-line:max-line-length
            `INSERT INTO ${ DB_TABLE_IGNORE } (${ DB_TABLE_IGNORE_COLUMN_QUERY_HASH }, ${ DB_TABLE_IGNORE_COLUMN_VALUES_HASH }) VALUES ('${ ignoreQueryDef.queryHash }', '${ ignoreQueryDef.valuesHash }')`);
    }

    // TODO [P. Labus] improve: make one bulk request that returns all ignored values
    isQueryIgnored(queryHash: string, valuesHash: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            // tslint:disable-next-line:max-line-length
            this.connection.query(`SELECT * from ${ DB_TABLE_IGNORE } WHERE ${ DB_TABLE_IGNORE_COLUMN_QUERY_HASH } = '${ queryHash }' AND WHERE ${ DB_TABLE_IGNORE_COLUMN_VALUES_HASH } = '${ valuesHash }'`, (error, results, fields) => {
                if (error) {
                    return reject(error);
                }

                resolve(results.length !== 0);
            });
        });
    }
}
