import { ConnectionPool } from 'mssql';
import { Client } from 'pg';

export interface Dbs {
    source: ConnectionPool;
    target: Client;
    idmap: any;
}