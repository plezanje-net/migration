import { ConnectionPool } from 'mssql';
import { Client } from 'ts-postgres';

export interface Dbs {
    source: ConnectionPool;
    target: Client;
    idmap: any;
}