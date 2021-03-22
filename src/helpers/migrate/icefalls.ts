import { Transfer } from './transfer';
import { v4 } from 'uuid';
import slugify from 'slugify';
import { parse } from 'fast-xml-parser';
import { Bbchtml } from './bbchtml';



export class IceFalls extends Transfer {

  async start() {

    this.dbs.target.query("TRUNCATE ice_fall CASCADE;")

    const bbchtml = new Bbchtml;

    const sourceRes = await this.dbs.source.request()
      .query('SELECT * FROM dbo.IceFalls ORDER BY IceFallSequence');

    let p = 0;
    let xmlData;

    for (let record of sourceRes.recordset) {
      p++;

      xmlData = record.XmlInfo != null ? parse(record.XmlInfo) : {};

      await this.createIceFall({
        id: v4(),
        name: record.IceFallName,
        difficulty: record.IceFallGrade,
        height: record.IceFallHeight,
        position: p,
        countryId: this.dbs.idmap.countries[record.IceFallCountry],
        areaId: this.dbs.idmap.areas[record.IceFallValley] != null ? this.dbs.idmap.areas[record.IceFallValley] : null,
        access: xmlData.access != null ? bbchtml.conv(xmlData.access) : null,
        description: xmlData.description != null ? bbchtml.conv(xmlData.description) : null,
        legacy: record
      })
    }
  }

  async createIceFall(iceFall: any) {
    await this.dbs.target.query("INSERT INTO ice_fall (id, name, difficulty, height, position, \"countryId\", \"areaId\", access, description, legacy) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)", [
      iceFall.id,
      iceFall.name,
      iceFall.difficulty,
      iceFall.height,
      iceFall.position,
      iceFall.countryId,
      iceFall.areaId,
      iceFall.access,
      iceFall.description,
      JSON.stringify(iceFall.legacy)
    ]);

    this.dbs.idmap.iceFalls[iceFall.legacy.IceFallID] = iceFall.id;
  }
}
