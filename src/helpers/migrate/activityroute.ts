import { Transfer } from './transfer';
import { v4 } from 'uuid';
import { info } from 'console';

export class ActivityRoute extends Transfer {

  idMap: any = {};

  async start() {

    const types: any = {
      S: "onsight", a: "t_onsight",
      F: "flash", b: "t_flash",
      R: "redpoint", t: "t_redpoint",
      l: "allfree", m: "t_allfree",
      h: "aid", j: "t_aid",
      x: "attempt", y: "t_attempt",
    };

    const publish: any = {
      L: "public",
      A: "log",
      F: "club",
    };

    let pitchesByNumAndRouteId: any = {};
    const pitchQuery = await this.dbs.target.query("SELECT id, \"routeId\", number FROM \"pitch\"");
    pitchQuery.rows.forEach(pitch => {
      pitchesByNumAndRouteId[pitch.routeId + "_" + pitch.number] = pitch.id;
    });

    let activityDates: any = {};
    let activityUsers: any = {};
    const activityQuery = await this.dbs.target.query("SELECT id, \"userId\", date FROM \"activity\"");
    activityQuery.rows.forEach(activity => {
      activityDates[activity.id] = activity.date;
      activityUsers[activity.id] = activity.userId;
    });

    this.dbs.target.query("TRUNCATE activity_route CASCADE;");

    let sourceRes = await this.dbs.source.request()
      .query('SELECT * FROM dbo.ClimbRoute');

    let routeId;
    let pitchId;
    let activityId;

    for (let record of sourceRes.recordset) {

      if (this.dbs.idmap.activity[record.ClimbDateID] != null) {
        activityId = this.dbs.idmap.activity[record.ClimbDateID];
      } else {
        activityId = null;
        continue;
      }

      routeId = this.dbs.idmap.routes[record.RouteID] || null;

      if (routeId != null) {
        pitchId = pitchesByNumAndRouteId[routeId + "_" + record.PitchNum] || null;
      } else {
        pitchId = null;
      }

      await this.createActivityRoute({
        id: v4(),
        userId: activityUsers[activityId],
        routeId: routeId,
        pitchId: pitchId,
        activityId: activityId,
        ascentType: types[record.AscentType] || "tick",
        date: activityDates[activityId],
        position: record.Sequence,
        notes: record.UserNotes,
        publish: publish[record.Publish] || 'private',
        updated: record.LastModified || activityDates[activityId],
        created: record.LastModified || activityDates[activityId],
        legacy: record
      })

    }
  }

  async createActivityRoute(activity: any) {
    await this.dbs.target.query(`
          INSERT INTO activity_route 
          (id, \"userId\", \"routeId\", \"pitchId\", \"activityId\", \"ascentType\", date, position, notes, publish, updated, created, legacy) 
          VALUES 
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`, [
      activity.id,
      activity.userId,
      activity.routeId,
      activity.pitchId,
      activity.activityId,
      activity.ascentType,
      activity.date,
      activity.position,
      activity.notes,
      activity.publish,
      activity.updated,
      activity.created,
      JSON.stringify(activity.legacy)
    ]);

  }
}