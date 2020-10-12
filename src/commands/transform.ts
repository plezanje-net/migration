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
import * as proj4 from 'proj4'

const gkProjection: string = '+proj=tmerc +lat_0=0 +lon_0=15 +k=0.9999 +x_0=500000 +y_0=-5000000 +ellps=bessel +towgs84=426.62,142.62,460.09,4.98,4.49,-12.42,-17.1 +units=m +no_defs +type=crs'
const wgsProjection: string = '+proj=longlat +datum=WGS84 +no_defs'
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

    const cragsWithLatLng = crags.map(crag => {
      const lngLat: number[] = proj4(gkProjection, wgsProjection).forward([crag.posX, crag.posY])

      return {
        ...crag,
        lang: lngLat[0],
        lat: lngLat[1],
      }
    })


    console.log(cragsWithLatLng);

    this.log("### DONE ###");
  }

}
