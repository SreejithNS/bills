import React from 'react';
import { render } from '@testing-library/react';
import BillCard,{BillCardData} from './index';

test('renders "BillCard" with data', () => {
    const customerData: BillCardData = {
        customerName: "Customer Name",
        billAmount: 54321.12,
        timestamp: "12 October 2020",
        deleteAction: ()=> true
    }
    const { getByText } = render(<BillCard {...customerData} />);
    const shopName = getByText(/Customer Name/i);
    expect(shopName).toBeInTheDocument();
    const billAmount = getByText(/54321\.12/i);
    expect(billAmount).toBeInTheDocument();
    const timestamp = getByText(/12 October 2020/i);
    expect(timestamp).toBeInTheDocument();
});
