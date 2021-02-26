import { Transfer } from './transfer';
import { v4 } from 'uuid';
import { info } from 'console';

export class Activity extends Transfer {

  idMap: any = {};

  async start() {

    const types: any = {
      W: "climbingGym",
      F: "trainingGym",
      I: "iceFall",
      P: "peak"
    };

    if (Object.values(this.dbs.idmap.users).length == 0) {
      const userQuery = await this.dbs.target.query("SELECT id, legacy FROM \"user\"");

      userQuery.rows.forEach(user => {
        const legacy = JSON.parse(user.legacy);
        if (JSON.parse(user.legacy)) {
          this.dbs.idmap.users[legacy.UserID] = user.id;
        }
      });
    }

    let cragsByOldId: any = {};

    const cragQuery = await this.dbs.target.query("SELECT id, name, legacy FROM \"crag\"");

    cragQuery.rows.forEach(crag => {
      const legacy = JSON.parse(crag.legacy);
      if (JSON.parse(crag.legacy)) {
        cragsByOldId[legacy.CragID] = crag;
      }
    });

    this.dbs.target.query("TRUNCATE activity CASCADE;");

    let sourceRes = await this.dbs.source.request()
      .query('SELECT * FROM dbo.ActivityLog');

    for (let record of sourceRes.recordset) {

      if (this.dbs.idmap.users[record.UserID] == undefined) {
        continue;
      }

      await this.createActivity({
        id: v4(),
        userId: this.dbs.idmap.users[record.UserID] || null,
        type: types[record.ActivityType] ?? 'other',
        name: record.TargetName,
        date: record.Date,
        duration: Math.round(record.TimeSpent * 60),
        notes: record.RichNotes,
        partners: record.Partner,
        cragId: null,
        updated: record.LastModified || record.Date,
        created: record.LastModified || record.Date,
        legacy: record
      })

    }

    sourceRes = await this.dbs.source.request()
    .query('SELECT * FROM dbo.ClimbCrag');

    let crag: any;   

    for (let record of sourceRes.recordset) {

      if (this.dbs.idmap.users[record.UserID] == undefined) {
        continue;
      }

      crag = cragsByOldId[record.Crag] || null;

      await this.createActivity({
        id: v4(),
        userId: this.dbs.idmap.users[record.UserID] || null,
        type: "crag",
        name: crag ? crag.name : "-- plezališče --",
        date: record.ClimbDate,
        duration: null,
        notes: record.UserNotes,
        partners: record.ClimbBelay,
        cragId: crag ? crag.id : null,
        updated: record.LastModified || record.ClimbDate,
        created: record.LastModified || record.ClimbDate,
        legacy: record
      })

    }    
  }

  async createActivity(activity: any) {
    await this.dbs.target.query(`
          INSERT INTO activity 
          (id, \"userId\", type, name, date, duration, notes, partners, \"cragId\", created, legacy) 
          VALUES 
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`, [
      activity.id,
      activity.userId,
      activity.type,
      activity.name,
      activity.date,
      activity.duration,
      activity.notes,
      activity.partners,
      activity.cragId,
      activity.created,
      JSON.stringify(activity.legacy)
    ]);

    this.dbs.idmap.activity[activity.legacy.ClimbDateID] = activity.id;
  }
}