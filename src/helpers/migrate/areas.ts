import { Transfer } from './transfer';
import { v4 } from 'uuid';
import slugify from 'slugify';

export class Areas extends Transfer {

    async start() {

        this.dbs.target.query("TRUNCATE area CASCADE;")

        const sourceRes = await this.dbs.source.request()
            .query('SELECT * FROM dbo.Areas');

        for (let record of sourceRes.recordset) {
            await this.createArea({
                id: v4(),
                name: record.AreaName,
                countryId: this.dbs.idmap.countries[record.AreaCountry],
                legacy: record
            })
        }
    }

    async createArea(area: any) {
        await this.dbs.target.query("INSERT INTO area (id, name, \"countryId\", legacy) VALUES ($1, $2, $3, $4)", [
            area.id,
            area.name,
            area.countryId,
            JSON.stringify(area.legacy)
        ]);

        this.dbs.idmap.areas[area.legacy.AreaID] = area.id;
    }
}