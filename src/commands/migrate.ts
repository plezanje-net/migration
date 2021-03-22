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
import { Images } from '../helpers/migrate/images';
import { Peaks } from '../helpers/migrate/peaks';
import { IceFalls } from '../helpers/migrate/icefalls';

export default class Migrate extends Command {

  static flags = {
    all: flags.boolean({ char: 'a' }),
    crags: flags.boolean(),
    activity: flags.boolean(),
    pitches: flags.boolean(),
    users: flags.boolean(),
    images: flags.boolean()
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
        images: {},
        iceFalls: {},
        peaks: {},
      }
    }

    // if (flags.all || flags.users) {
    if (false) {
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

      this.log('- Migrating peaks');
      const peakTransfer = new Peaks(dbs);
      await peakTransfer.start();

      this.log('- Migrating ice falls');
      const iceFallTransfer = new IceFalls(dbs);
      await iceFallTransfer.start();

      this.log('- Migrating crags');
      const cragTransfer = new Crags(dbs);
      await cragTransfer.start();

      // this.log('- Migrating routes and sectors');
      // const routesTransfer = new Routes(dbs);
      // await routesTransfer.start();

      this.log('- Migrating comments');
      const commentsTransfer = new Comments(dbs);
      await commentsTransfer.start();

      dbs.target.query(`
      UPDATE country SET
        "nrCrags" = (SELECT COUNT(crag.id) FROM crag WHERE crag."countryId" = country.id AND crag."peakId" IS NULL)
      `);

      dbs.target.query(`
      UPDATE area SET
        "nrCrags" = (SELECT COUNT(crag.id) FROM crag WHERE crag."areaId" = area.id AND crag."peakId" IS NULL)
      `);

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

      const areasQuery = await dbs.target.query("SELECT id, name, legacy FROM \"area\"");

      areasQuery.rows.forEach(area => {
        const legacy = JSON.parse(area.legacy);
        if (JSON.parse(area.legacy)) {
          dbs.idmap.areas[legacy.AreaID] = area.id;
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

    // if (flags.all || flags.images) {
    //   this.log("# IMAGES");

    //   const imagesTransfer = new Images(dbs);
    //   await imagesTransfer.start();

    // }

    this.log("### MIGRATION DONE ###");

    this.exit(0);
  }


}
