import { Dbs } from './dbs';

export class Transfer {
    dbs: Dbs;
    constructor(dbs: Dbs) {
        this.dbs = dbs;
    }
}