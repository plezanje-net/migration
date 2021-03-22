import { Transfer } from './transfer';
import { v4 } from 'uuid';
import slugify from 'slugify';
import { parse } from 'fast-xml-parser';
import * as proj4 from 'proj4'
import { Bbchtml } from './bbchtml';

const gkProjection: string = '+proj=tmerc +lat_0=0 +lon_0=15 +k=0.9999 +x_0=500000 +y_0=-5000000 +ellps=bessel +towgs84=426.62,142.62,460.09,4.98,4.49,-12.42,-17.1 +units=m +no_defs +type=crs'
const wgsProjection: string = '+proj=longlat +datum=WGS84 +no_defs'

export class Peaks extends Transfer {

  idMap: any = {};

  async start() {

    this.dbs.target.query("TRUNCATE peak CASCADE;")

    const bbchtml = new Bbchtml;

    const sourceRes = await this.dbs.source.request()
      .query('SELECT * FROM dbo.Peaks');

    let xmlData;

    for (let record of sourceRes.recordset) {

      xmlData = record.XmlInfo != null ? parse(record.XmlInfo) : {};

      let lngLat: number[] = [0, 0];

      try {
        lngLat = proj4(gkProjection, wgsProjection).forward([record.X, record.Y])
      } catch { }

      await this.createPeak({
        id: v4(),
        name: record.PeakName,
        height: record.PeakHeight,
        countryId: this.dbs.idmap.countries[record.PeakCountry],
        areaId: this.dbs.idmap.areas[record.PeakArea] != null ? this.dbs.idmap.areas[record.PeakArea] : null,
        lon: lngLat[0] == 0 ? null : lngLat[0],
        lat: lngLat[1] == 0 ? null : lngLat[1],
        description: xmlData.description != null ? bbchtml.conv(xmlData.description) : null,
        legacy: record
      })

      if (xmlData.lref != null) {
        await this.createBookRefs(this.dbs.idmap.peaks[record.PeakID], xmlData.lref)
      }
    }
  }

  async createPeak(peak: any) {
    await this.dbs.target.query(`
            INSERT INTO peak
            (id, name, height, \"countryId\", \"areaId\", lat, lon, description, legacy)
            VALUES
            ($1, $2, $3, $4, $5, $6, $7, $8, $9)`, [
      peak.id,
      peak.name,
      peak.height,
      peak.countryId,
      peak.areaId,
      peak.lat,
      peak.lon,
      peak.description,
      JSON.stringify(peak.legacy)
    ]);

    this.dbs.idmap.peaks[peak.legacy.PeakID] = peak.id;
  }

  async createBookRefs(id: string, refs: string[]) {
    for (let ref of refs) {
      if (this.dbs.idmap.books[ref] != null) {
        try {
          await this.dbs.target.query(`INSERT INTO peak_books_book (\"peakId\", \"bookId\") VALUES ($1, $2)`, [
            id,
            this.dbs.idmap.books[ref]
          ])
        } catch (e) {

        }
      }
    }

  }
}
