import { Transfer } from './transfer';
import { v4 } from 'uuid';
import slugify from 'slugify';
import * as fs from 'fs';


export class Images extends Transfer {

  async start() {

    this.dbs.target.query("TRUNCATE image CASCADE;")

    const sourceRes = await this.dbs.source.request()
      .query('SELECT TOP (2000) * FROM dbo.Images');

    let id;
    let buffer;
    let legacy;
    let type;
    let relations;

    for (let record of sourceRes.recordset) {
      id = v4();

      legacy = Object.assign({}, record);
      delete legacy.ImageBlob;

      if (record.ImageUsage == 'M') {
        type = 'map';
      } else if (record.ImageUsage == 'S') {
        type = 'sketch';
      } else {
        type = 'photo';
      }

      relations = {
        cragId: null,
        areaId: null,
        routeId: null,
        userId: null,
      };

      this.setRelations(relations, record.ImageRef);

      // await this.createImage({
      //   id: id,
      //   title: record.Comments,
      //   description: null,
      //   path: `${id}.${record.ImageType}`,
      //   extension: record.ImageType,
      //   type: type,
      //   legacy: legacy
      // })

      // buffer = Buffer.from(record.ImageBlob);
      // fs.writeFile(`./images/${id}.${record.ImageType}`, buffer, () => { });
    }

  }

  async setRelations(relations: any, imageRef: string) {
    const type = imageRef.substring(0, 2);
    const refId = imageRef.substring(2);

    if (type == 'CG') {
      relations.cragId = this.dbs.idmap.crags[refId] ?? null;
      // console.log('CRAG - ' + relations.cragId);
    }

    if (type == 'AR') {
      relations.cragId = this.dbs.idmap.areas[refId] ?? null;
      // console.log('AREA - ' + relations.areaId);
    }

    if (type == 'RT') {
      relations.routeId = this.dbs.idmap.routes[refId] ?? null;
      console.log('ROUTE - ' + refId + ' -  ' + relations.routeId);
    }
  }

  async createImage(image: any) {

    await this.dbs.target.query(`
      INSERT INTO image (
        id, title, description, path, extension, type, "cragId", "areaId", "routeId", "userId" legacy)
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
      )`, [
      image.id,
      image.title,
      image.description,
      image.path,
      image.extension,
      image.type,
      image.cragId,
      image.areaId,
      image.routeId,
      image.userId,
      JSON.stringify(image.legacy)
    ]);

    this.dbs.idmap.images[image.legacy.ImageID] = image.id;
  }
}
