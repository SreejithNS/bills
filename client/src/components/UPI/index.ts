import { Validator } from 'format-utils';

export default class UPI {
    public currency = "INR";
    constructor(
        public readonly name: string,
        public readonly vpa: string,
        public amount?: number,
        public note?: string,
        public url?: string | URL
    ) {
        if (!Validator.vpa(vpa)) {
            throw new Error("Invalid UPI VPA");
        }
     }

    toString() {
        const params = new URLSearchParams([
            ["pa", this.vpa],
            ["pn", this.name]
        ]);

        if (this.amount) {
            params.append("am", this.amount.toFixed(2));
            params.append("cu", this.currency);
        }

        if (this.note) {
            params.append("tn", this.note);
        }

        if (this.url) {
            params.append("url", this.url.toString());
        }

        return "upi://pay?" + params.toString();
    }
}