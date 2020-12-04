import React from 'react';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import UpdateSalesmanPasswordForm from "../UpdateSalesmanPasswordForm";

export default function UpdateSalesmanPasswordDialog(props: {
    open: boolean; handleClose: () => void; onSubmit: any
}) {
    return (
        <Dialog open={props.open} onClose={props.handleClose} aria-labelledby="form-dialog-title">
            <DialogTitle id="form-dialog-title">Update Password</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Type in your new password for this salesman.
          </DialogContentText>
                <UpdateSalesmanPasswordForm onSubmit={props.onSubmit} />
            </DialogContent>
            <DialogActions>
                <Button onClick={props.handleClose} color="primary">
                    Cancel
          </Button>
            </DialogActions>
        </Dialog>
    );
}