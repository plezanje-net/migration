import { Transfer } from './transfer';
import { v4 } from 'uuid';
import slugify from 'slugify';

export class Books extends Transfer {

    async start() {

        this.dbs.target.query("TRUNCATE book CASCADE;")

        const sourceRes = await this.dbs.source.request()
            .query('SELECT * FROM dbo.BookRefs');

        for (let record of sourceRes.recordset) {
            await this.createBook({
                id: v4(),
                name: record.RefTitle,
                author: record.RefAuthor,
                publisher: record.RefPublisher,
                year: record.RefPubDate,
                legacy: record
            })
        }
    }

    async createBook(book: any) {
        await this.dbs.target.query("INSERT INTO book (id, name, author, publisher, year, legacy) VALUES ($1, $2, $3, $4, $5, $6)", [
            book.id,
            book.name,
            book.author,
            book.publisher,
            book.year,
            JSON.stringify(book.legacy)
        ]);

        this.dbs.idmap.books[book.legacy.RefID] = book.id;
    }
}