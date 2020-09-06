import { Dbs } from './dbs';
import { Transfer } from './transfer';
import { v4 } from 'uuid';
import { default as slugify } from 'slugify';
import { Areas } from './areas';
import { Crags } from './crags';


export class Countries extends Transfer {

    async start() {
        this.dbs.target.query("TRUNCATE country CASCADE;")

        const sourceRes = await this.dbs.source.request()
            .query('SELECT * FROM dbo.Country');

        let idMap: any = {};

        for (let record of sourceRes.recordset) {

            await this.createCountry({
                id: v4(),
                code: record.CountryCode,
                name: record.CountryName,
                slug: slugify(record.CountryName, { lower: true }),
                legacy: record
            })

        }
    }

    async createCountry(country: any) {
        await this.dbs.target.query("INSERT INTO country (id, code, name, slug, legacy) VALUES ($1, $2, $3, $4, $5)", [
            country.id,
            country.code,
            country.name,
            country.slug,
            JSON.stringify(country.legacy)
        ]);

        this.dbs.idmap.countries[country.legacy.CountryCode] = country.id;
    }
}