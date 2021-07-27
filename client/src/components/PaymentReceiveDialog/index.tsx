import React, { useEffect, useState } from 'react';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import { BillData } from '../../reducers/bill.reducer';
import useAxios from 'axios-hooks';
import { APIResponse, handleAxiosError } from '../Axios';
import { toast } from 'react-toastify';

type Props = BillData & { open: boolean; onClose: () => any; };

export default function PaymentReceiveDialog({ _id, open, onClose, paidAmount, billAmount }: Props) {
    const [amount, setAmount] = useState(0);
    const [{ loading, error, data }, post] = useAxios<APIResponse<null>>({
        url: `/bill/${_id}/payment`,
        method: "POST",
        data: {
            paidAmount: amount
        }
    }, { manual: true });

    useEffect(() => {
        if (data) {
            setAmount(0);
            toast.success("Payment Received");
            onClose();
        }
        //eslint-disable-next-line
    }, [data])

    useEffect(() => {
        if (error) {
            handleAxiosError(error);
        }
    }, [error]);

    return (
        <Dialog open={open} onClose={onClose} aria-labelledby="form-dialog-title">
            <DialogTitle id="form-dialog-title">Receive Amount</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Enter the amount you received for this Bill.
                </DialogContentText>
                <TextField
                    autoFocus
                    disabled={loading}
                    margin="dense"
                    label="Amount in ₹"
                    type="number"
                    fullWidth
                    value={amount || ""}
                    onChange={(event) => {
                        const value = Math.abs(parseFloat(event.target.value) || 0);
                        const balance = billAmount - paidAmount;
                        if (value <= balance)
                            setAmount(value);
                    }}
                />
                {amount !== (billAmount - paidAmount) && <Button variant="text" onClick={() => setAmount(billAmount - paidAmount)}>
                    GET FULL AMOUNT
                </Button>}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={loading} color="primary">
                    Cancel
                </Button>
                <Button onClick={() => amount > 0 ? post() : toast.warn("Enter a valid amount")} disabled={loading} color="primary">
                    Confirm
                </Button>
            </DialogActions>
        </Dialog>
    );
}