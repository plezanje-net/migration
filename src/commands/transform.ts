import { Command } from '@oclif/command';
import { default as slugify } from 'slugify';
import { ConnectionPool, config } from 'mssql';
import { Dbs } from '../helpers/migrate/dbs';
import { Countries } from '../helpers/migrate/countries';
import { Areas } from '../helpers/migrate/areas';
import { Crags } from '../helpers/migrate/crags';
import { Books } from '../helpers/migrate/books';
import { Routes } from '../helpers/migrate/routes';
import { Users } from '../helpers/migrate/users';

import { Client } from 'pg';

export default class Migrate extends Command {
  static description = 'Transform coordinates script'

  static args = []

  async run() {

    this.log("### TRANSFORMING ###");

    const crags = [
      {
        name: "Retovje",
        posX: 445960,
        posY: 89960,
        lat: "",
        lang: ""
      },
      {
        name: "Osp",
        posX: 411400,
        posY: 48200,
        lat: "",
        lang: ""
      },
      {
        name: "Kotečnik",
        posX: 514180,
        posY: 117280,
        lat: "",
        lang: ""
      }
    ];

    console.log(crags);

    // do your magic <3

    console.log(crags);

    this.log("### DONE ###");
  }

}
