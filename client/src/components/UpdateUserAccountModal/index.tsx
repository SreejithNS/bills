import React, { useEffect, useState } from 'react';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import CloseIcon from '@material-ui/icons/Close';
import Slide from '@material-ui/core/Slide';
import { TransitionProps } from '@material-ui/core/transitions';
import { Box, CircularProgress, Container, Divider, TextField } from '@material-ui/core';
import { useHistory } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../reducers/rootReducer';
import useAxios from 'axios-hooks';
import { APIResponse, handleAxiosError } from '../Axios';
import AccountEditForm from './AccountEditForm';
import { Close, Check } from '@material-ui/icons';
import { toast } from 'react-toastify';
import { UserData } from '../../reducers/auth.reducer';
import { useAuthActions } from '../../actions/auth.actions';

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        appBar: {
            position: 'relative',
        },
        title: {
            marginLeft: theme.spacing(2),
            flex: 1,
        },
        containerPadding: {
            padding: theme.spacing(2)
        }
    }),
);

const Transition = React.forwardRef(function Transition(
    props: TransitionProps & { children?: React.ReactElement },
    ref: React.Ref<unknown>,
) {
    return <Slide direction="up" ref={ref} {...props} />;
});

function PasswordUpdate() {
    const [newPassword, setNewPassword] = useState<string>();
    const userId = useSelector((state: RootState) => state.auth.userData?._id);
    const [{ loading: passwordUpdateLoading, error: passwordUpdateError, data: passwordUpdateResponse }, updatePassword, reset] = useAxios<APIResponse<UserData>>(
        {
            url: `/auth/${userId}.password`,
            method: "PUT",
            data: { value: newPassword },
        }, { manual: true }
    );
    useEffect(() => {
        if (passwordUpdateResponse && !passwordUpdateLoading) {
            toast.success("User Password updated");
            setNewPassword(undefined);
            reset();
        }
        if (passwordUpdateError) handleAxiosError(passwordUpdateError);
        //eslint-disable-next-line
    }, [passwordUpdateLoading, passwordUpdateError, passwordUpdateResponse]);

    return (<div style={{ margin: "2em 2em 0 0" }}>
        <Typography variant="subtitle1" style={{ marginBottom: "0.5em" }}>Update Password</Typography>
        <Box display="flex" alignItems="center" justifyContent="flex-start">
            <TextField
                variant="outlined"
                label="New Password"
                onChange={(event) => {
                    const value = event.target.value;
                    setNewPassword(value === "" ? undefined : value);
                }}
                value={newPassword ?? ""}
            />
            <IconButton disabled={(!newPassword)} onClick={() => { setNewPassword(undefined); }}>
                <Close />
            </IconButton>
            <IconButton disabled={newPassword === undefined || passwordUpdateLoading} onClick={() => updatePassword()}>
                <Check />
            </IconButton>
        </Box>
    </div>
    )
}

export default function UpdateUserAccountModal(props: { onCreate?: () => void; visible?: boolean; onClose?: any; }) {
    const [open, setOpen] = useState(true);
    const classes = useStyles();
    const history = useHistory();
    const { userData: initialData, loading: dataLoading } = useSelector((state: RootState) => state.auth);
    const userId = initialData?._id;
    const [{ loading, error, data }, postData] = useAxios<APIResponse<any>>({ url: "/product", method: "POST" }, { manual: true });
    const { fetchUserData } = useAuthActions();
    const handleSubmit = (values: any) => {
        return postData({ url: `/auth/${userId}`, method: "PUT", data: values })
    }

    if (error) handleAxiosError(error);

    useEffect(() => {
        if (data) {
            toast.success("Account Details Updated Successfully");
            fetchUserData().then(() => {
                if (props.onCreate) props.onCreate()
                else history.goBack()
            })
        }
        if (error) {
            handleAxiosError(error)
        }
        //eslint-disable-next-line
    }, [data, error])

    return (
        <Dialog fullScreen open={props.visible ?? open} onClose={props.onClose ?? (() => { setOpen(false); history.goBack() })} TransitionComponent={Transition}>
            <AppBar className={classes.appBar}>
                <Toolbar>
                    <IconButton edge="start" color="inherit" onClick={props.onClose ?? (() => { setOpen(false); history.goBack() })} aria-label="close">
                        <CloseIcon />
                    </IconButton>
                    <Typography variant="h6" className={classes.title}>
                        Edit User Account
                    </Typography>
                    <Button  color="inherit" onClick={props.onClose ?? (() => { setOpen(false); history.goBack() })}>
                        Cancel
                    </Button>
                </Toolbar>
            </AppBar>
            <Container fixed className={classes.containerPadding}>
                {dataLoading
                    ? <CircularProgress />
                    : <>
                        <AccountEditForm onSubmit={handleSubmit} submiting={loading} initialValues={initialData} />
                        <Divider />
                        <PasswordUpdate />
                    </>
                }
            </Container>
        </Dialog>
    );
}
