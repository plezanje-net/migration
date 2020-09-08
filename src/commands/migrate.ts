import { Command } from '@oclif/command';
import { default as slugify } from 'slugify';
import { ConnectionPool, config } from 'mssql';
import { Dbs } from '../helpers/migrate/dbs';
import { Countries } from '../helpers/migrate/countries';
import { Client } from 'ts-postgres';
import { Areas } from '../helpers/migrate/areas';
import { Crags } from '../helpers/migrate/crags';
import { Books } from '../helpers/migrate/books';
import { Routes } from '../helpers/migrate/routes';
import { Users } from '../helpers/migrate/users';


export default class Migrate extends Command {
  static description = 'Migrate all from local MSSQL server to PostgreSQL'

  static args = []

  async run() {

    this.log("### MIGRATION STARTED ###");

    const msconfig: config = {
      user: 'migration',
      password: 'migration',
      server: "localhost",
      database: "plezanjenet",
      options: {
        enableArithAbort: false
      }
    }

    const pgclient = new Client({
      host: 'localhost',
      user: 'plezanjenet',
      password: 'plezanjenet',
      database: 'plezanjenet',
    });

    await pgclient.connect();

    const dbs: Dbs = {
      source: await new ConnectionPool(msconfig).connect(),
      target: pgclient,
      idmap: {
        areas: {},
        books: {},
        countries: {},
        crags: {},
        grades: {},
        sectors: {},
        routes: {},
        users: {},
      }
    }

    this.log('- Migrating users');
    const userTransfer = new Users(dbs);
    await userTransfer.start();

    this.log('- Migrating countries');
    const countryTransfer = new Countries(dbs);
    await countryTransfer.start();

    this.log('- Migrating books');
    const bookTransfer = new Books(dbs);
    await bookTransfer.start();

    this.log('- Migrating areas');
    const areaTransfer = new Areas(dbs);
    await areaTransfer.start();

    this.log('- Migrating crags');
    const cragTransfer = new Crags(dbs);
    await cragTransfer.start();

    this.log('- Migrating routes and sectors');
    const routesTransfer = new Routes(dbs);
    await routesTransfer.start();

    dbs.target.query("DELETE FROM area WHERE (SELECT COUNT(id) FROM crag WHERE \"areaId\" = area.id) = 0");

    dbs.target.query("DELETE FROM country WHERE (SELECT COUNT(id) FROM crag WHERE \"countryId\" = country.id) = 0");

    this.log("### MIGRATION DONE ###");
  }

}
