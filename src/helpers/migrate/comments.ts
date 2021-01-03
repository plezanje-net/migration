import { Transfer } from './transfer';
import { v4 } from 'uuid';
import slugify from 'slugify';
import { parse } from 'fast-xml-parser';
import * as proj4 from 'proj4'
import { Bbchtml } from './bbchtml';

const gkProjection: string = '+proj=tmerc +lat_0=0 +lon_0=15 +k=0.9999 +x_0=500000 +y_0=-5000000 +ellps=bessel +towgs84=426.62,142.62,460.09,4.98,4.49,-12.42,-17.1 +units=m +no_defs +type=crs'
const wgsProjection: string = '+proj=longlat +datum=WGS84 +no_defs'

export class Comments extends Transfer {

    idMap: any = {};

    async start() {
        
        const types: any = {
            W: "warning",
            S: "condition",
            N: "description",
            C: "comment"
        };
        
        this.dbs.target.query("TRUNCATE comment CASCADE;")

        const bbchtml = new Bbchtml;

        let sourceRes = await this.dbs.source.request()
            .query('SELECT * FROM dbo.CragComments');

        for (let record of sourceRes.recordset) {

            await this.createComment({
                id: v4(),
                type: types[record.CommentType] ?? 'comment',
                content: bbchtml.conv(record.CommentText),
                userId: this.dbs.idmap.users[record.UserID] ?? null,
                cragId: this.dbs.idmap.crags[record.CragID],
                routeId: null,
                created: record.LastModified,
                legacy: record
            })

        }

        sourceRes = await this.dbs.source.request()
            .query('SELECT * FROM dbo.RouteComments');

        for (let record of sourceRes.recordset) {

            if (this.dbs.idmap.crags[record.RouteID] != null) {

                await this.createComment({
                    id: v4(),
                    type: types[record.CommentType] ?? 'comment',
                    content: record.CommentText,
                    userId: this.dbs.idmap.users[record.UserID] ?? null,
                    cragId: null,
                    routeId: this.dbs.idmap.routes[record.RouteID],
                    created: record.LastModified,
                    legacy: record
                })
            }

        }
    }

    async createComment(comment: any) {
        await this.dbs.target.query(`
            INSERT INTO comment 
            (id, type, content, \"userId\", \"cragId\", \"routeId\", created, legacy) 
            VALUES 
            ($1, $2, $3, $4, $5, $6, $7, $8)`, [
            comment.id,
            comment.type,
            comment.content,
            comment.userId,
            comment.cragId,
            comment.routeId,
            comment.created,
            JSON.stringify(comment.legacy)
        ]);
    }
}