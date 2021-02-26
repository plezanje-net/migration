import { Command } from '@oclif/command';

import { Client } from 'pg';

export default class Migrate extends Command {
  static description = 'Transform coordinates script'

  static args = []

  async run() {

    this.log("### TRANSFORMING ###");

    const db = new Client({
      host: 'localhost',
      user: 'plezanjenet',
      password: 'plezanjenet',
      database: 'plezanjenet'
    });

    await db.connect()

    this.log("### DONE ###");
  }

}
