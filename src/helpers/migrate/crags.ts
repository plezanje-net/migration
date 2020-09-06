import { Transfer } from './transfer';
import { v4 } from 'uuid';
import slugify from 'slugify';
import { parse } from 'fast-xml-parser';


export class Crags extends Transfer {

    idMap: any = {};

    async start() {

        this.dbs.target.query("TRUNCATE crag CASCADE;")

        const sourceRes = await this.dbs.source.request()
            .query('SELECT * FROM dbo.Crags WHERE PeakID IS NULL');

        let xmlData;

        for (let record of sourceRes.recordset) {

            let slug = slugify(record.CragName, { lower: true });
            let slugPfx = '';
            let slugPfxCnt = 0;

            while ((await this.dbs.target.query("SELECT * FROM crag WHERE slug = $1", [slug + slugPfx])).rows.length > 0) {
                slugPfxCnt++;
                slugPfx = '-' + slugPfxCnt;
            }

            xmlData = record.XmlInfo != null ? parse(record.XmlInfo) : {};

            await this.createCrag({
                id: v4(),
                name: record.CragName,
                slug: slug + slugPfx,
                countryId: this.dbs.idmap.countries[record.CragCountry],
                areaId: this.dbs.idmap.areas[record.ParentID] != null ? this.dbs.idmap.areas[record.ParentID] : null,
                status: record.HideLevel == 1 ? 10 : 5,
                lat: record.X,
                lang: record.Y,
                orientation: xmlData.orient != null ? xmlData.orient : null,
                access: xmlData.access != null ? xmlData.access : null,
                description: xmlData.description != null ? xmlData.description : null,
                legacy: record
            })

            if (xmlData.lref != null) {
                await this.createBookRefs(this.dbs.idmap.crags[record.CragID], xmlData.lref)
            }
        }
    }

    async createCrag(crag: any) {
        await this.dbs.target.query(`
            INSERT INTO crag 
            (id, name, slug, \"countryId\", \"areaId\", status, lat, lang, orientation, access, description, legacy) 
            VALUES 
            ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`, [
            crag.id,
            crag.name,
            crag.slug,
            crag.countryId,
            crag.areaId,
            crag.status,
            crag.lat,
            crag.lang,
            crag.orientation,
            crag.access,
            crag.description,
            JSON.stringify(crag.legacy)
        ]);

        this.dbs.idmap.crags[crag.legacy.CragID] = crag.id;
    }

    async createBookRefs(id: string, refs: string[]) {
        for (let ref of refs) {
            if (this.dbs.idmap.books[ref] != null) {
                await this.dbs.target.query(`INSERT INTO crag_books_book (\"cragId\", \"bookId\") VALUES ($1, $2)`, [
                    id,
                    this.dbs.idmap.books[ref]
                ])
            }
        }

    }
}