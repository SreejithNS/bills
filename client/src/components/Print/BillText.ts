import { store } from "../..";
import { Escpos } from "../escpos-commands/src/escpos";

class TextManipulator {
    public chunkString(str: string, length: number) {
        return str.match(new RegExp(".{1," + length + "}", "g")) ?? [];
    }

    public leftAlignText(str: string, fixedLength: number) {
        if (fixedLength < 3)
            throw new Error("Fixed length should be greater than 2");

        const splittedString = this.chunkString(str, fixedLength - 2)
            .map((chunk) => chunk.split("\n"))
            .flat();

        return splittedString.map((chunk) =>
            chunk
                .trim()
                .padEnd(chunk.length + Math.floor(fixedLength - 2 - chunk.length), " ")
                .padStart(fixedLength - 2, " ")
        );
    }

    public rightAlignText(str: string, fixedLength: number) {
        if (fixedLength < 3)
            throw new Error("Fixed length should be greater than 2");

        const splittedString = this.chunkString(str, fixedLength - 2)
            .map((chunk) => chunk.split("\n"))
            .flat();

        return splittedString.map((chunk) =>
            chunk
                .trim()
                .padStart(
                    chunk.length + Math.floor(fixedLength - 2 - chunk.length),
                    " "
                )
                .padEnd(fixedLength - 2, " ")
        );
    }

    public centerText(str: string, fixedLength: number) {
        if (fixedLength < 3)
            throw new Error("Fixed length should be greater than 2");

        const splittedString = this.chunkString(str, fixedLength - 2)
            .map((chunk) => chunk.split("\n"))
            .flat();

        return splittedString.map((chunk) =>
            chunk
                .trim()
                .padStart(
                    chunk.length + Math.floor((fixedLength - 2 - chunk.length) / 2),
                    " "
                )
                .padEnd(fixedLength - 2, " ")
        );
    }
}

class TextTable extends TextManipulator {
    private headers: string[] = [];
    private contents: string[][] = [];

    private proportion: number[] = [];

    constructor(private length: number = 44, private columns: number = 3) {
        super();
    }

    getProportionalLength(): number[] {
        if (this.proportion.length !== this.columns)
            return new Array(this.columns).fill(
                Math.floor(this.length / this.columns)
            );

        const sum = this.proportion.reduce((curr, acc) => curr + acc, 0);
        return new Array(this.columns).map((_, index) => {
            return Math.round((this.proportion[index] / sum) * this.length);
        });
    }

    addHeader(headerName: string | string[]) {
        if (this.headers.length < this.columns)
            if (Array.isArray(headerName)) {
                if (this.headers.length + headerName.length <= this.columns) {
                    this.headers.push(...headerName);
                } else
                    console.warn(
                        `TextTable: Maximum headers reached, "${headerName.join(
                            ","
                        )}" isn't added.`
                    );
            } else {
                this.headers.push(headerName);
            }
        else
            console.warn(
                `TextTable: Maximum headers reached, "${headerName}" isn't added.`
            );
    }

    addContent(...data: any[]) {
        if (data.length > this.length)
            throw new Error("TextTable: Content data exceeded table columns");

        return this.contents.push(data.map((content) => content.toString()));
    }

    constructHeaderText(cellPadding = 2) {
        const chunckedHeaders: string[][] = this.headers.map((header, index) =>
            this.centerText(header, this.getProportionalLength()[index] - cellPadding)
        );
        const row = Math.max(...chunckedHeaders.map((chunk) => chunk.length));
        return chunckedHeaders
            .map((_, colIndex) =>
                chunckedHeaders.map((row, index) => {
                    return (
                        row[colIndex] ??
                        this.centerText(
                            " ",
                            this.getProportionalLength()[index] - cellPadding
                        )
                    );
                })
            )
            .splice(0, row);
    }

    constructContentText(cellPadding = 2) {
        const chunckedContents: string[][][] = this.contents.map((content) =>
            content.map((data, index) => {
                if (index === 0)
                    return this.leftAlignText(
                        data,
                        this.getProportionalLength()[index] - cellPadding
                    );
                else if (index === this.columns - 1)
                    return this.rightAlignText(
                        data,
                        this.getProportionalLength()[index] - cellPadding
                    );
                else
                    return this.centerText(
                        data,
                        this.getProportionalLength()[index] - cellPadding
                    );
            })
        );

        const row = Math.max(
            ...chunckedContents.map((content) =>
                content.reduce((prev, curr) => curr.length + prev, 0)
            )
        );

        return chunckedContents.map((content) =>
            content
                .map((_, colIndex) =>
                    content.map((row, index) => {
                        return (
                            row[colIndex] ??
                            this.centerText(
                                " ",
                                this.getProportionalLength()[index] - cellPadding
                            )
                        );
                    })
                )
                .splice(0, row)
        );
    }
}

export default class BillText {
    private buffer = new Escpos();
    public table?: TextTable;
    public lineWidth = 44;

    constructor(
        private customerName: string,
        private billSerial: number,
        private date: string,
        private salesman: string,
        private items: string[][],
        private billAmount: number,
        private itemsTotalAmount: number,
        private discount?: number,
        private tax?: number,
    ) { }

    toPrintBuffer() {
        const organisation = store.getState().auth.organistaionData;
        const { buffer: p, customerName } = this;
        //Reset Buffer
        p.flush();
        p.init().lineSpace(null);


        //Organisation header
        p.boldOn().size(2, 2);
        if (organisation) {
            (new TextManipulator()).centerText(organisation.printTitle, 18).map(line => p.text(line));
        } else {
            (new TextManipulator()).centerText("Billz App", 18).map(line => p.text(line));
        }

        p.boldOff().size(1, 1).feed(1);

        //Print Header
        if (organisation?.printHeader) {
            (new TextManipulator()).centerText(organisation.printHeader, 34).map(line => p.text(line));
            p.feed(1);
        }

        //Date
        p.align("RT")
            .text("Date: " + (new Date(this.date)).toLocaleDateString("ca"))
            .feed(1)
            .align("LT");

        //Customer Name
        p.boldOn().text("Customer:" + customerName).boldOff().control("LF");

        //Bill Serial
        p.control("CR")
            .text("Bill No.#" + this.billSerial)
            .control("LF").feed(1);

        //Table
        this.table = new TextTable(this.lineWidth, 3);
        this.table.addHeader(["Item", "Qty", "Amount"]);

        const header = this.table.constructHeaderText();
        //Table Header
        p.boldOn();
        for (let headerLine of header) {
            p.text(headerLine.join(" ")).control("LF");
        }
        p.text("-".repeat(this.lineWidth - 12))
            .boldOff()
            .control("LF");

        //Table Content
        for (let item of this.items) {
            this.table.addContent(...item);
        }
        const contents = this.table.constructContentText();

        for (let content of contents) {
            for (let row of content) {
                if (!row.join(" ").replace(/\s/g, "").length || row.join(" ").replace(/\s/g, "").length < 4) continue;
                p.text(row.join(" ")).control("LF");
            }
        }

        p.control("LF");

        //Total Sum
        if (this.discount || this.tax) {
            (new TextManipulator()).centerText("Sum: " + (this.itemsTotalAmount), 33).map(line => p.text(line));
        }

        if (this.tax) {
            (new TextManipulator()).centerText("GST Total: " + (this.tax), 33).map(line => p.text(line));
        }

        //Discount
        if (this.discount) {
            (new TextManipulator()).centerText("Discount: -" + this.discount, 35).map(line => p.text(line));
            p.control("LF");
        }


        //Organisation header
        p.boldOn().size(2, 2);
        // p.text("Total:\t" + this.billAmount)
        (new TextManipulator()).centerText("Total: " + this.billAmount, 18).map(line => p.text(line));
        p.boldOff().size(1, 1);

        //Print Footer
        if (organisation?.printFooter) {
            p.feed(2);
            p.text("-".repeat(this.lineWidth - 12))
                .boldOff()
                .control("LF");
            (new TextManipulator()).centerText(organisation.printFooter, 34).map(line => p.text(line));
            p.feed(1);
            p.text("-".repeat(this.lineWidth - 12))
                .boldOff()
        }

        //Tear space
        p.feed(4);

        return p.flush();
    }
}
