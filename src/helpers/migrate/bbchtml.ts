import { Dbs } from './dbs';

export class Bbchtml {
    constructor() {
    }

    conv(str: string) {

        const regs = [
            {
                f: /\[b\](.*?)\[\/b\]/gm,
                r: '<b>$1</b>'
            },
            {
                f: /\[i\](.*?)\[\/i\]/gm,
                r: '<i>$1</i>'
            },
            {
                f: /\[u\](.*?)\[\/u\]/gm,
                r: '<span class="text-decoration: underline;">$1</span>'
            },
            {
                f: /\[img\](.*?)\[\/img\]/gm,
                r: '<img src="$1" />'
            },
            {
                f: /\[url\](.*?)\[\/url\]/gm,
                r: '<a href="$1">$1</a>'
            },
            {
                f: /[\n]/gm,
                r: '<br>'
            },
            {
                f: /\[\/img\]/gm,
                r: ''
            },
            {
                f: /\[img\]/gm,
                r: ''
            }, 
            {
                f: /\[linkref\=(.*?)\](.*?)\[\/linkref\]/gm,
                r: '<a href="$1">$2</a>'
            }     
        ];

        for (let reg of regs) {
            str = str.replace(reg.f, reg.r);
        }

        return str;
    }
}