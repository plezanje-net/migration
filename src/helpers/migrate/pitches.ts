import { Transfer } from './transfer';
import { v4 } from 'uuid';
import slugify from 'slugify';

export class Pitches extends Transfer {

    async start() {

        this.dbs.target.query("TRUNCATE pitch CASCADE;")

        const sourceRes = await this.dbs.source.request()
            .query('SELECT * FROM dbo.Pitches');

        for (let record of sourceRes.recordset) {

            if (this.dbs.idmap.routes[record.RouteID] == undefined) {
                continue;
            }

            await this.createPitch({
                id: v4(),
                routeId: this.dbs.idmap.routes[record.RouteID],
                number: record.PitchNum,
                difficulty: record.PitchDiff,
                height: record.PitchHeight,
                legacy: record
            })
        }
    }

    async createPitch(pitch: any) {
        await this.dbs.target.query("INSERT INTO pitch (id, \"routeId\", number, difficulty, height, legacy) VALUES ($1, $2, $3, $4, $5, $6)", [
            pitch.id,
            pitch.routeId,
            pitch.number,
            pitch.difficulty,
            pitch.height,
            JSON.stringify(pitch.legacy)
        ]);

        this.dbs.idmap.pitches[pitch.legacy.pitchID] = pitch.id;
    }
}