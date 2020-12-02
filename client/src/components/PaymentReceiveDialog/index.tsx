import React from 'react';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import { connect } from 'react-redux';
import { postReceivePayment } from '../../actions/bill.actions';

type Props = { billId: string; open: boolean; onClose(): void; } & ReturnType<typeof mapDispatchToProps>;

class PaymentReceiveDialog extends React.Component<Props> {
    state = {
        value: 0
    }
    handleReceive = () => {
        if (this.state.value > 0) {
            this.props.receivePayment(this.state.value, this.props.billId);
            this.props.onClose();
        }
    }
    render() {
        const { open, onClose } = this.props;
        return (
            <Dialog open={open} onClose={onClose} aria-labelledby="form-dialog-title">
                <DialogTitle id="form-dialog-title">Receive Amount</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Enter the amount you received for this Bill.
                    </DialogContentText>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Amount in ₹"
                        type="number"
                        fullWidth
                        value={this.state.value}
                        onChange={(event) => this.setState({ value: parseInt(event.target.value) })}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose} color="primary">
                        Cancel
          </Button>
                    <Button onClick={this.handleReceive} color="primary">
                        Confirm
          </Button>
                </DialogActions>
            </Dialog>
        );
    }
}

const mapDispatchToProps = (dispatch: (arg0: any) => any) => {
    return {
        receivePayment: (amount: number, billId: string) => dispatch(postReceivePayment(billId, amount))
    }
};

export default connect(null, mapDispatchToProps)(PaymentReceiveDialog)