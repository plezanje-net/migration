import { Transfer } from './transfer';
import { v4 } from 'uuid';
import slugify from 'slugify';

export class Routes extends Transfer {

    async start() {

        this.dbs.target.query("TRUNCATE sector CASCADE;")
        this.dbs.target.query("TRUNCATE route CASCADE;")

        const sourceRes = await this.dbs.source.request()
            .query('SELECT * FROM dbo.Routes ORDER BY RouteCrag, SequenceNumber');

        let lastCrag = null;
        let lastSector = null;
        let s = 0;
        let r = 0;

        let sectorSource;
        let cragSectors: any = {};

        for (let record of sourceRes.recordset) {
            if (!(this.dbs.idmap.crags[record.RouteCrag] != null)) continue;

            if (record.RouteCrag != lastCrag) {
                lastCrag = record.RouteCrag;
                s = 0;
                cragSectors = {};
                lastSector = null;

                sectorSource = await this.dbs.source.request()
                    .query('SELECT * FROM dbo.CragSectors WHERE SectorCrag = \'' + lastCrag + '\' ORDER BY SectorSequence')

                for (let sectorRecord of sectorSource.recordset) {
                    s++;
                    await this.createSector({
                        id: v4(),
                        name: sectorRecord.SectorName,
                        label: sectorRecord.SectorLabel,
                        position: s,
                        status: 10,
                        cragId: this.dbs.idmap.crags[lastCrag],
                        legacy: sectorRecord
                    })

                    cragSectors[sectorRecord.SectorRoute] = this.dbs.idmap.sectors[sectorRecord.SectorID];
                }

                r = 0;
            }
            r++;

            if (cragSectors[record.RouteID] != null) {
                lastSector = cragSectors[record.RouteID];
            }

            if (lastSector == null) {
                lastSector = v4();
                await this.createSector({
                    id: lastSector,
                    name: '',
                    label: '',
                    position: 1,
                    status: 10,
                    cragId: this.dbs.idmap.crags[lastCrag],
                    legacy: { SectorID: '' }
                });
            }

            await this.createRoute({
                id: v4(),
                name: record.RouteName,
                routeDiff: record.RouteDiff,
                author: record.RouteEventCache,
                status: 10,
                sectorId: lastSector,
                position: r,
                length: record.RouteHeigth,
                difficulty: record.RouteDiff,
                legacy: record
            })
        }
    }

    async createSector(sector: any) {
        await this.dbs.target.query("INSERT INTO sector (id, name, label, position, status, \"cragId\", legacy) VALUES ($1, $2, $3, $4, $5, $6, $7)", [
            sector.id,
            sector.name,
            sector.label,
            sector.position,
            sector.status,
            sector.cragId,
            JSON.stringify(sector.legacy)
        ]);

        this.dbs.idmap.sectors[sector.legacy.SectorID] = sector.id;
    }

    async createRoute(route: any) {

        await this.dbs.target.query("INSERT INTO route (id, name, author, status, \"sectorId\", position, length, difficulty, legacy) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)", [
            route.id,
            route.name,
            route.author,
            route.status,
            route.sectorId,
            route.position,
            route.length,
            route.difficulty,
            JSON.stringify(route.legacy)
        ]);

        this.dbs.idmap.routes[route.legacy.RouteID] = route.id;

        await this.createGrades(route)
    }

    async createGrades(route: any) {
        let grades = [];

        const gradeSource = await this.dbs.source.request()
            .query('SELECT * FROM dbo.RouteGrades WHERE RouteID = \'' + route.legacy.RouteID + '\'');

        for (let record of gradeSource.recordset) {

            if (gradeSource.recordset.length > 2 || record.UserID == '00000000-0000-0000-0000-000000000000') {
                grades.push(record.Grade);
            }

            await this.dbs.target.query("INSERT INTO grade (id, created, \"userId\", grade, \"routeId\", legacy) VALUES ($1, $2, $3, $4, $5, $6)", [
                v4(),
                record.LastModified,
                this.dbs.idmap.users[record.UserID],
                record.Grade,
                route.id,
                JSON.stringify(record)
            ]);
        }

        if (grades.length == 0) {

            let baseGrade = await this.createBaseGrade(route)

            if (baseGrade != null) {
                grades.push(baseGrade);
            } else {
                return;
            }
        }

        let sum = 0;

        grades.sort();
        let trim = Math.round(grades.length / 5);

        grades.splice(0, trim);
        grades.splice(trim * -1, trim)

        for (let grade of grades) {
            sum += grade;
        }

        let grade = sum / grades.length;

        this.dbs.target.query("UPDATE route SET grade = $1 WHERE id = $2", [
            isNaN(grade) ? null : grade,
            route.id
        ]);
    }

    async createBaseGrade(route: any) {

        let grade = route.legacy.RouteDiff;

        if (grade == "P" || grade == null) {
            return null;
        }

        const n = parseInt(grade.substring(0, 1));
        const c = grade.substring(1, 2);

        let mod = 0;

        if (c == 'b') {
            mod = 100;
        }

        if (c == 'c') {
            mod = 200;
        }

        if (grade.length == 5) {
            mod += 25;
        }

        if (grade.length == 3) {
            mod += 50;
        }

        if (grade.length == 6) {
            mod += 75;
        }

        let baseGrade = (7 - (7 - n) * 3) * 100 + mod;

        if (!isNaN(baseGrade)) {
            await this.dbs.target.query("INSERT INTO grade (id, created, grade, \"routeId\") VALUES ($1, $2, $3, $4)", [
                v4(),
                route.legacy.LastModified,
                baseGrade,
                route.id
            ]);

            return baseGrade;
        }

        return null;
    }
}