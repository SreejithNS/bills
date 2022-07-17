

interface GSTProduct {
    hsn: string;
    sgst: number;
    cgst: number;
    gstInclusive: boolean;
}

class GSTClass {

    /**
     * Calculate a produce a gst tax summary for all products in the list
     * @param {GSTProduct[]} products 
     */
    calculateSummaryOfProducts(products: any[]) {
        let productsWithGSTCalculations = products.map((product: { sgst: any; cgst: any; amount: number; gstInclusive: any; }) => {
            const tax = ((product.sgst || 0) + (product.cgst || 0)) / 100;
            debugger;
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
        const gstTotalAccumulator = (acc: any, product: { taxAmount: any; taxableAmount: any; }) => {
            return acc + product.taxAmount + product.taxableAmount;
        };

        /**
         * Accumulate tax amount for each product with respect its tax inclusion.
         * @param {number} acc 
         * @param {GSTProduct} product 
         * @returns number
         */
        const gstTaxAccumulator = (acc: any, product: { taxAmount: any; }) => {
            return acc + product.taxAmount;
        };

        /**
         * Get the slabs of each tax
         * @param {keyof GSTProduct} tax 
         */
        const getSlabs = (tax: string | number) => {
            // @ts-ignore
            return [...new Set(productsWithGSTCalculations.map((product: { [x: string]: any; }) => product[tax]))].filter(percentage => percentage > 0);
        };

        /**
         * Get total tax amount for each slabs in a tax
         * Example: if slab 5 is given, then it will return total tax amount of @5% slab
         * @param {keyof GSTProduct} tax 
         */
        const getTotalTaxAmountForSlab = (tax: string) => {
            const slabs = getSlabs(tax);
            return slabs.map(slab => {
                const productsWithSlab = productsWithGSTCalculations.filter((product: { [x: string]: any; }) => product[tax] === slab);

                const totalTaxableAmount = productsWithSlab.reduce((prev: number, curr: any) => {
                    const fraction = ((curr[tax] || 0) / 100);
                    const taxAmount = curr.amount * fraction;
                    const taxableAmount = curr.gstInclusive ? curr.amount - taxAmount : curr.amount * 1;
                    return prev + taxableAmount;
                }, 0);

                const totalTaxAmount = productsWithSlab.reduce((prev: number, curr: any) => {
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
            totalTaxableAmount: productsWithGSTCalculations.reduce((acc: any, curr: { taxableAmount: any; }) => {
                return acc + curr.taxableAmount;
            }, 0),
            totalAmountWithTax: productsWithGSTCalculations.reduce(gstTotalAccumulator, 0),
        };

        return summary;
    }
}

export const GST = new GSTClass();