import React, { useEffect } from 'react';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import { useTheme } from '@material-ui/core/styles';
import { CheckInForm } from './CheckInForm';
import useAxios from 'axios-hooks';
import { APIResponse, handleAxiosError } from '../Axios';
import { CheckInDTO } from '../../types/CheckIn';
import { toast } from 'react-toastify';

export default function CheckInEntryDialog<T = undefined>({ onClose, open, title = "Dialog", onSubmit }: {
    title?: string;
    open?: boolean;
    onClose?: () => void;
    onSubmit?: (data: T) => void;
}) {
    const [isOpen, setIsOpen] = React.useState(open ?? false);
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

    const [{ loading, data, error }, submit,cancel] = useAxios<APIResponse<CheckInDTO>>({ url: `/checkin`, method: "POST" }, { manual: true });

    //Error handling
    useEffect(() => {
        if (error) {
            handleAxiosError(error);
        }
    }, [error]);

    // Handle Success
    useEffect(() => {
        if (data) {
            toast.success("Check-In Successful");
        }
    }, [data]);

    // Cleanup
    useEffect(() => {
        return () => {
            cancel();
        }
    }, [cancel]);

    const handleClose = () => {
        cancel();
        setIsOpen(false);
        if (onClose) onClose();
    };

    return (
        <div>
            <Dialog
                fullScreen={fullScreen}
                open={open ?? isOpen}
                onClose={onClose ?? handleClose}
                aria-labelledby="responsive-dialog-title"
                scroll='paper'
            >
                <DialogTitle id="responsive-dialog-title">
                    {title}
                </DialogTitle>
                <DialogContent>
                    <CheckInForm loading={loading} onSubmit={(data: any) => {
                        submit({
                            data
                        }).then(() => {
                            handleClose();
                        })
                    }} >
                        <DialogActions>
                            <Button  onClick={handleClose} color="primary">
                                Cancel
                            </Button>
                            <Button disabled={loading} type="submit" color="primary" >
                                Submit
                            </Button>
                        </DialogActions>
                    </CheckInForm>
                </DialogContent>
            </Dialog>
        </div >
    );
}
