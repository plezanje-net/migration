import { Command, flags } from '@oclif/command';
import { default as slugify } from 'slugify';
import { ConnectionPool, config } from 'mssql';
import { Dbs } from '../helpers/migrate/dbs';
import { Countries } from '../helpers/migrate/countries';
import { Areas } from '../helpers/migrate/areas';
import { Crags } from '../helpers/migrate/crags';
import { Books } from '../helpers/migrate/books';
import { Routes } from '../helpers/migrate/routes';
import { Users } from '../helpers/migrate/users';

import { Client } from 'pg';
import { Comments } from '../helpers/migrate/comments';
import { Bbchtml } from '../helpers/migrate/bbchtml';
import { Activity } from '../helpers/migrate/activity';
import { Pitches } from '../helpers/migrate/pitches';
import { boolean } from '@oclif/command/lib/flags';
import { ActivityRoute } from '../helpers/migrate/activityroute';

export default class Migrate extends Command {

  static flags = {
    all: flags.boolean({ char: 'a' }),
    crags: flags.boolean(),
    activity: flags.boolean(),
    pitches: flags.boolean(),
    users: flags.boolean()
  }

  static description = 'Migrate all from local MSSQL server to PostgreSQL'

  static args = []

  async run() {

    this.log("### MIGRATION STARTED ###");

    const { flags } = this.parse(Migrate)

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
      database: 'plezanjenet'
      // host: '35.246.30.8',
      // user: 'postgres',
      // password: 'vCeMJJvmaKjFOzOE',
      // database: 'plezanjenet'
    });

    await pgclient.connect()

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
        pitches: {},
        users: {},
        activity: {},
      }
    }

    if (flags.all || flags.users) {
      this.log("# USERS");
      this.log('- Migrating users');
      const userTransfer = new Users(dbs);
      await userTransfer.start();
    } else {
      const userQuery = await dbs.target.query("SELECT id, legacy FROM \"user\"");

      userQuery.rows.forEach(user => {
        const legacy = JSON.parse(user.legacy);
        if (JSON.parse(user.legacy)) {
          dbs.idmap.users[legacy.UserID] = user.id;
        }
      });
    }

    if (flags.all || flags.crags) {

      this.log("# CRAGS");

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

      this.log('- Migrating comments');
      const commentsTransfer = new Comments(dbs);
      await commentsTransfer.start();

      dbs.target.query("DELETE FROM area WHERE (SELECT COUNT(id) FROM crag WHERE \"areaId\" = area.id) = 0");

      dbs.target.query("DELETE FROM country WHERE (SELECT COUNT(id) FROM crag WHERE \"countryId\" = country.id) = 0");

      dbs.target.query(`
      UPDATE crag SET
      "maxGrade" = (SELECT MAX(route.grade) FROM route WHERE route."sectorId" IN (SELECT sector.id FROM sector WHERE sector."cragId" = crag.id)), 
      "minGrade" = (SELECT MIN(route.grade) FROM route WHERE route."sectorId" IN (SELECT sector.id FROM sector WHERE sector."cragId" = crag.id)),
      "nrRoutes" = (SELECT COUNT(route.id) FROM route WHERE route."sectorId" IN (SELECT sector.id FROM sector WHERE sector."cragId" = crag.id))    
    `);

    } else {
      const cragQuery = await dbs.target.query("SELECT id, name, legacy FROM \"crag\"");

      cragQuery.rows.forEach(crag => {
        const legacy = JSON.parse(crag.legacy);
        if (JSON.parse(crag.legacy)) {
          dbs.idmap.crags[legacy.CragID] = crag.id;
        }
      });

      const routesQuery = await dbs.target.query("SELECT id, name, legacy FROM \"route\"");

      routesQuery.rows.forEach(route => {
        const legacy = JSON.parse(route.legacy);
        if (JSON.parse(route.legacy)) {
          dbs.idmap.routes[legacy.RouteID] = route.id;
        }
      });
    }

    if (flags.all || flags.pitches) {
      this.log('- Migrating pitches');
      const pitchesTransfer = new Pitches(dbs);
      await pitchesTransfer.start();
    }

    if (flags.all || flags.activity) {
      this.log("# USER ACTIVITY");

      this.log('- Migrating activity');
      const activityTransfer = new Activity(dbs);
      await activityTransfer.start();

      this.log('- Migrating activity routes');
      const activityRouteTransfer = new ActivityRoute(dbs);
      await activityRouteTransfer.start();
    } else {
      const activityQuery = await dbs.target.query("SELECT id, legacy FROM \"activity\"");
      activityQuery.rows.forEach(activity => {
        const legacy = JSON.parse(activity.legacy);
        if (JSON.parse(activity.legacy)) {
          dbs.idmap.activity[legacy.ClimbDateID] = activity.id;
        }
      });
    }

    this.log("### MIGRATION DONE ###");

    this.exit(0);
  }
  

}
