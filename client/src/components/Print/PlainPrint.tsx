import React from 'react';
import { useSelector } from 'react-redux';
import { BillData } from '../../reducers/bill.reducer';
import { RootState } from '../../reducers/rootReducer';
import "./print.css";

type PlainPrintProps = {
    bill: BillData;
};

const PlainPrint = React.forwardRef<HTMLDivElement, PlainPrintProps>(({ bill }, ref) => {
    const { organistaionData: org } = useSelector((state: RootState) => state.auth);
    return (
        <div id="print-view" ref={ref} >
            <table>
                <thead>
                    <tr>
                        <th colSpan={100}>{org?.printTitle}</th>
                    </tr>
                    {org?.printHeader
                        ? <tr>
                            <td colSpan={100}>{org?.printHeader}</td>
                        </tr>
                        : <></>
                    }
                    <tr>
                        <td colSpan={100} className="text-right">Date: {(new Date(bill.createdAt)).toLocaleDateString("ca")}</td>
                    </tr>
                    <tr>
                        <td colSpan={100} className="text-left">
                            Customer:{bill.customer.name}<br />
                            Bill No.: {bill.serialNumber}
                        </td>
                    </tr>
                    <tr className="column-titles">
                        <th>Item</th>
                        <th>Quantity</th>
                        <th>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {bill.items.map((item, key) =>
                        <tr key={key}>
                            <td>{item.name}</td>
                            <td>{item.quantity}{item.unit ? (item.unit as unknown as string).split(" ").map((c: string) => c.charAt(0)).join("").toUpperCase() : ""}</td>
                            <td>{(item.rate * item.quantity).toFixed(2)}</td>
                        </tr>
                    )}
                </tbody>
                < tfoot >
                    {
                        bill.discountAmount > 0
                            ? <>
                                <tr>
                                    <td className="text-center" colSpan={100}>Sum: {bill.gstSummary ? bill.gstSummary.totalTaxableAmount : bill.itemsTotalAmount.toINR()}</td>
                                </tr>
                                <tr>
                                    <td className="text-center" colSpan={100}>Discount: -{bill.discountAmount.toINR()}</td>
                                </tr>
                            </>
                            : <tr>
                                <td className="text-center" colSpan={100}>Sum:  {bill.gstSummary ? bill.gstSummary.totalTaxableAmount : bill.itemsTotalAmount.toINR()}</td>
                            </tr>
                    }
                    {
                        bill.gstSummary ? <>
                            <tr>
                                <td colSpan={100} className="text-center">GST Total:  {bill.gstSummary.totalTax.toINR()}</td>
                            </tr>
                        </> : <></>
                    }
                    <tr>
                        <td colSpan={100} className="bill-total">Bill Total:  {bill.billAmount.toINR()}</td>
                    </tr>
                    {org?.printFooter
                        ? <tr>
                            <td colSpan={100}>{org.printFooter}</td>
                        </tr>
                        : <></>
                    }
                </tfoot>
            </table>
        </div>
    );
});

export default PlainPrint;