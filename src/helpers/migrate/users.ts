import { Transfer } from './transfer';
import { v4 } from 'uuid';

import * as faker from 'faker';


export class Users extends Transfer {

    async start() {
        this.dbs.target.query("TRUNCATE \"user\" CASCADE;")

        const sourceRes = await this.dbs.source.request()
            .query('SELECT * FROM dbo.Users WHERE Email LIKE \'%@%\' ORDER BY Changed ASC');

        let emails = [];
        let email;
        let name;

        for (let record of sourceRes.recordset) {

            // email = record.Email;
            email = faker.internet.email();

            while (emails.indexOf(email) > -1) {
                email = '-' + email;
            }

            // name = record.NameSurname;
            name = faker.name.findName();

            await this.createUser({
                id: v4(),
                email: email,
                firstname: name.split(' ')[0],
                lastname: name.split(' ').slice(1).join(' '),
                www: record.URL,
                gender: record.Sex,
                password: record.ShaPassword,
                legacy: record
            })

            emails.push(email);

        }
    }

    async createUser(user: any) {
        await this.dbs.target.query(`
            INSERT INTO \"user\" (
                id, email, firstname, lastname, www, gender, password, legacy
                ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8
            )`, [
            user.id,
            user.email,
            user.firstname,
            user.lastname,
            user.www,
            user.gender,
            user.password,
            JSON.stringify(user.legacy)
        ]);

        this.dbs.idmap.users[user.legacy.UserID] = user.id;
    }
}