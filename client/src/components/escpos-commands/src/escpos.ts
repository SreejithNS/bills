import CMD from "./commands";
import { MutableBuffer } from "mutable-buffer";

export class Escpos {
    buffer: any;

    constructor() {
        this.buffer = new MutableBuffer();
    }

    init() {
        this.buffer.write(CMD.HARDWARE.HW_INIT);
        return this;
    }

    boldOn() {
        this.buffer.write(CMD.TEXT_FORMAT.TXT_BOLD_ON);
        return this;
    }

    boldOff() {
        this.buffer.write(CMD.TEXT_FORMAT.TXT_BOLD_OFF);
        return this;
    }

    marginBottom(size: any) {
        this.buffer.write(CMD.MARGINS.BOTTOM);
        this.buffer.writeUInt8(size);
        return this;
    }

    marginLeft(size: any) {
        this.buffer.write(CMD.MARGINS.LEFT);
        this.buffer.writeUInt8(size);
        return this;
    }

    marginRight(size: any) {
        this.buffer.write(CMD.MARGINS.RIGHT);
        this.buffer.writeUInt8(size);
        return this;
    }

    text(content: any) {
        this.buffer.write(content);
        return this;
    }

    feed(n = 3) {
        this.buffer.write(new Array(n || 1).fill(CMD.EOL).join(''));
        return this;
    }

    control(ctrl: string) {
        this.buffer.write(CMD.FEED_CONTROL_SEQUENCES[
            'CTL_' + ctrl.toUpperCase() as keyof typeof CMD.FEED_CONTROL_SEQUENCES
        ]);
        return this;
    }

    align(align: string) {
        this.buffer.write(CMD.TEXT_FORMAT[
            'TXT_ALIGN_' + align.toUpperCase() as keyof typeof CMD.TEXT_FORMAT
        ]);
        return this;
    }

    font(family: string) {
        this.buffer.write(CMD.TEXT_FORMAT[
            'TXT_FONT_' + family.toUpperCase() as keyof typeof CMD.TEXT_FORMAT
        ]);
        return this;
    }

    size(width: number, height: number) {
        if (2 >= width && 2 >= height) {
            this.buffer.write(CMD.TEXT_FORMAT.TXT_NORMAL);
            if (2 === width && 2 === height) {
                this.buffer.write(CMD.TEXT_FORMAT.TXT_4SQUARE);
            } else if (1 === width && 2 === height) {
                this.buffer.write(CMD.TEXT_FORMAT.TXT_2HEIGHT);
            } else if (2 === width && 1 === height) {
                this.buffer.write(CMD.TEXT_FORMAT.TXT_2WIDTH);
            }
        } else {
            this.buffer.write(CMD.TEXT_FORMAT.TXT_CUSTOM_SIZE(width, height));
        }
        return this;
    }

    lineSpace(n = null) {
        if (n === null) {
            this.buffer.write(CMD.LINE_SPACING.LS_DEFAULT);
        } else {
            this.buffer.write(CMD.LINE_SPACING.LS_SET);
            this.buffer.writeUInt8(n);
        }
        return this;
    }

    barcode(code: string, type = 'CODE128', width = 3, height = 100, position = 'BTH', font = 'B') {
        let convertCode = String(code);
        if (typeof type === 'undefined' || type === null) {
            throw new TypeError('barcode type is required');
        }
        if (type === 'EAN13' && convertCode.length !== 12) {
            throw new Error('EAN13 Barcode type requires code length 12');
        }
        if (type === 'EAN8' && convertCode.length !== 7) {
            throw new Error('EAN8 Barcode type requires code length 7');
        }
        if (width >= 2 || width <= 6) {
            this.buffer.write(CMD.BARCODE_FORMAT.BARCODE_WIDTH[width as keyof typeof CMD.BARCODE_FORMAT.BARCODE_WIDTH]);
        } else {
            this.buffer.write(CMD.BARCODE_FORMAT.BARCODE_WIDTH_DEFAULT);
        }
        if (height >= 1 || height <= 255) {
            this.buffer.write(CMD.BARCODE_FORMAT.BARCODE_HEIGHT(height));
        } else {
            this.buffer.write(CMD.BARCODE_FORMAT.BARCODE_HEIGHT_DEFAULT);
        }
        this.buffer.write(CMD.BARCODE_FORMAT[
            'BARCODE_FONT_' + (font || 'B').toUpperCase() as keyof typeof CMD.BARCODE_FORMAT
        ]);
        this.buffer.write(CMD.BARCODE_FORMAT[
            'BARCODE_TXT_' + (position || 'BTH').toUpperCase() as keyof typeof CMD.BARCODE_FORMAT
        ]);
        this.buffer.write(CMD.BARCODE_FORMAT[
            'BARCODE_' + ((type || 'EAN13').replace('-', '_').toUpperCase()) as keyof typeof CMD.BARCODE_FORMAT
        ]);
        let codeBytes = code.split('').map((s: string) => s.charCodeAt(0));
        this.buffer.write(codeBytes.length);
        this.buffer.write(codeBytes);
        this.buffer.write('\x00');
        return this;
    }

    qrcode(code: string | any[], version = 3, level = 3, size = 8) {
        this.buffer.write(CMD.CODE2D_FORMAT.CODE2D);
        this.buffer.writeUInt8(version);
        this.buffer.writeUInt8(level);
        this.buffer.writeUInt8(size);
        this.buffer.writeUInt16LE(code.length);
        this.buffer.write(code);
        return this;
    }

    hardware(hw: string) {
        this.buffer.write(CMD.HARDWARE['HW_' + hw as keyof typeof CMD.HARDWARE]);
        return this.flush();
    }

    cashdraw(pin: any) {
        this.buffer.write(CMD.CASH_DRAWER[
            'CD_KICK_' + (pin || 2) as keyof typeof CMD.CASH_DRAWER
        ]);
        return this.flush();
    }

    cut(part: any, feed: any) {
        this.feed(feed || 3);
        this.buffer.write(CMD.PAPER[
            part ? 'PAPER_PART_CUT' : 'PAPER_FULL_CUT'
        ]);
        return this.flush();
    }

    flush() {
        return this.buffer.flush();
    }

};
