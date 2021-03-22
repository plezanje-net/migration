import { Transfer } from './transfer';
import { v4 } from 'uuid';
import slugify from 'slugify';
import { parse } from 'fast-xml-parser';
import * as proj4 from 'proj4'
import { Bbchtml } from './bbchtml';

const gkProjection: string = '+proj=tmerc +lat_0=0 +lon_0=15 +k=0.9999 +x_0=500000 +y_0=-5000000 +ellps=bessel +towgs84=426.62,142.62,460.09,4.98,4.49,-12.42,-17.1 +units=m +no_defs +type=crs'
const wgsProjection: string = '+proj=longlat +datum=WGS84 +no_defs'

export class Crags extends Transfer {

    idMap: any = {};

    async start() {

        this.dbs.target.query("TRUNCATE crag CASCADE;")

        const bbchtml = new Bbchtml;

        const sourceRes = await this.dbs.source.request()
            .query('SELECT * FROM dbo.Crags');

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

            let lngLat: number[] = [0,0];

            try {
                lngLat = proj4(gkProjection, wgsProjection).forward([record.X, record.Y])
            } catch {}

            await this.createCrag({
                id: v4(),
                name: record.CragName,
                slug: slug + slugPfx,
                countryId: this.dbs.idmap.countries[record.CragCountry],
                areaId: this.dbs.idmap.areas[record.ParentID] != null ? this.dbs.idmap.areas[record.ParentID] : null,
                peakId: this.dbs.idmap.peaks[record.PeakID] != null ? this.dbs.idmap.peaks[record.PeakID] : null,
                status: record.HideLevel == 1 ? 5 : 10,
                lon: lngLat[0] == 0 ? null : lngLat[0] ,
                lat: lngLat[1] == 0 ? null : lngLat[1],
                orientation: xmlData.orient != null ? xmlData.orient : null,
                access: xmlData.access != null ? bbchtml.conv(xmlData.access) : null,
                description: xmlData.description != null ? bbchtml.conv(xmlData.description) : null,
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
            (id, name, slug, \"countryId\", \"areaId\", \"peakId\", status, lat, lon, orientation, access, description, legacy)
            VALUES
            ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`, [
            crag.id,
            crag.name,
            crag.slug,
            crag.countryId,
            crag.areaId,
            crag.peakId,
            crag.status,
            crag.lat,
            crag.lon,
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
