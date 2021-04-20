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

type Props = { billId: BillData["_id"]; open: boolean; onClose: () => any; };

export default function PaymentReceiveDialog({ billId, open, onClose }: Props) {
    const [amount, setAmount] = useState(1);
    const [{ loading, error, data }, post] = useAxios<APIResponse<null>>({
        url: `/bill/${billId}/payment`,
        method: "POST",
        data: {
            paidAmount: amount
        }
    }, { manual: true });

    useEffect(() => {
        if (data) {
            toast.success("Payment Received");
            onClose();
        }
        //eslint-disable-next-line
    }, [data])

    if (error) {
        handleAxiosError(error);
    }

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
                    value={amount}
                    onChange={(event) => {
                        const value = Math.abs(parseFloat(event.target.value));
                        setAmount(value > 0 ? value : 1);
                    }}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={loading} color="primary">
                    Cancel
          </Button>
                <Button onClick={() => post()} disabled={loading} color="primary">
                    Confirm
          </Button>
            </DialogActions>
        </Dialog>
    );
}