/**
 * @typedef {Object} GSTProduct
 * @property {string} [hsn=""]
 * @property {number} [sgst=0]
 * @property {number} [cgst=0]
 * @property {boolean} [gstInclusive=false]
 */

const { Product } = require("../../models/ProductModel");

/**
 * @class GST
 */
class GST {
    constructor() {
        this.permissionName = "GST";
        this.permissions = {
            "create": "ALLOW_" + this.permissionName + "_POST",
        };

        this.populateOptions = [
        ];
    }
    /**
     * Add GST details to product
     * @param {import("mongoose").Types.ObjectId|string|import("../../models/ProductModel").Product} id 
     * @param {GSTProduct} data 
     */
    async addGSTDetailsToProduct(id, data) {
        const product = id instanceof Product ? id : await Product.findById(id);
        if (!product) {
            throw new Error("Product not found");
        }

        product.hsn = data.hsn;
        product.sgst = data.sgst;
        product.cgst = data.cgst;
        await product.save();
    }

    /**
     * Calculate a produce a gst tax summary for all products in the list
     * @param {GSTProduct[]} products 
     */
    calculateSummaryOfProducts(products) {
        let productsWithGSTCalculations = products.map(product => {
            const tax = ((product.sgst || 0) + (product.cgst || 0)) / 100;
            const taxAmount = product.amount * tax;
            const taxableAmount = product.gstInclusive ? product.amount - taxAmount : product.amount * 1;
            return {
                hsn: "",
                sgst: 0,
                cgst: 0,
                gstInclusive: false,
                ...product,
                taxAmount,
                taxableAmount,
            };
        });

        /**
         * Accumulate amount for each product with respect its tax inclusion.
         * @param {number} acc 
         * @param {GSTProduct} product 
         * @returns number
         */
        const gstTotalAccumulator = (acc, product) => {
            return acc + product.taxAmount + product.taxableAmount;
        };

        /**
         * Accumulate tax amount for each product with respect its tax inclusion.
         * @param {number} acc 
         * @param {GSTProduct} product 
         * @returns number
         */
        const gstTaxAccumulator = (acc, product) => {
            return acc + product.taxAmount;
        };

        /**
         * Get the slabs of each tax
         * @param {keyof GSTProduct} tax 
         */
        const getSlabs = (tax) => {
            return [...new Set(productsWithGSTCalculations.map(product => product[tax]))].filter(percentage => percentage > 0);
        };

        /**
         * Get total tax amount for each slabs in a tax
         * Example: if slab 5 is given, then it will return total tax amount of @5% slab
         * @param {keyof GSTProduct} tax 
         */
        const getTotalTaxAmountForSlab = (tax) => {
            const slabs = getSlabs(tax);
            return slabs.map(slab => {
                const productsWithSlab = productsWithGSTCalculations.filter(product => product[tax] === slab);

                const totalTaxableAmount = productsWithSlab.reduce((prev, curr) => {
                    const fraction = ((curr[tax] || 0) / 100);
                    const taxAmount = curr.amount * fraction;
                    const taxableAmount = curr.gstInclusive ? curr.amount - taxAmount : curr.amount * 1;
                    return prev + taxableAmount;
                }, 0);

                const totalTaxAmount = productsWithSlab.reduce((prev, curr) => {
                    return prev + (curr.amount * ((curr[tax] || 0) / 100));
                }, 0);

                return {
                    slab,
                    totalTaxAmount,
                    totalTaxableAmount
                };
            });
        };

        const totalTax = productsWithGSTCalculations.reduce(gstTaxAccumulator, 0);

        let summary = {
            totalTax,
            products: productsWithGSTCalculations,
            slabs: {
                sgst: getTotalTaxAmountForSlab("sgst"),
                cgst: getTotalTaxAmountForSlab("cgst")
            },
            totalTaxableAmount: productsWithGSTCalculations.reduce((acc, curr) => {
                return acc + curr.taxableAmount;
            }, 0),
            totalAmountWithTax: productsWithGSTCalculations.reduce(gstTotalAccumulator, 0),
        };

        return summary;
    }
}

exports.GST = new GST();