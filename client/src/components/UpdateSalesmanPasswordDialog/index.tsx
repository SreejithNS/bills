import React, { useEffect, useState } from 'react';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import UpdateSalesmanPasswordForm from "../UpdateSalesmanPasswordForm";
import useAxios from "axios-hooks";
import { toast } from 'react-toastify';

export default function UpdateSalesmanPasswordDialog(props: {
    open: boolean; handleClose: () => void; salesmanId: string;
}) {
    const [data, setData] = useState<{ password: string }>({ password: "" });
    const [{ error: updatePasswordError, loading: updatePasswordLoading, data: updatedResponse }, initiateUpdatePassword] = useAxios({}, { manual: true });

    useEffect(() => {
        if (data.password.length) {
            initiateUpdatePassword({ url: `/${props.salesmanId}.password/${data.password}`, method: "PUT" });
        }
        if (updatePasswordError) {
            toast.error("Couldn't update password");
        }
        if (updatedResponse) {
            toast.success("Password Updated");
            props.handleClose();
        }
    }, [data, updatePasswordError, updatedResponse, initiateUpdatePassword, props]);

    return (
        <Dialog open={props.open} onClose={props.handleClose} aria-labelledby="form-dialog-title">
            <DialogTitle id="form-dialog-title">Update Password</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Type in your new password for this salesman.
          </DialogContentText>
                <UpdateSalesmanPasswordForm submitting={updatePasswordLoading} onSubmit={setData} />
            </DialogContent>
            <DialogActions>
                <Button onClick={props.handleClose} disabled={updatePasswordLoading} color="primary">
                    Cancel
          </Button>
            </DialogActions>
        </Dialog>
    );
}