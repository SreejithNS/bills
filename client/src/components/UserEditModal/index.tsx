import { Checkbox, Divider, Grid, IconButton, List, ListItem, ListItemIcon, ListItemSecondaryAction, ListItemText, ListSubheader, Paper as BasePaper, Switch, TextField, Theme, withStyles } from "@material-ui/core";
import React, { useEffect, useState } from "react";
import Modal from "../Modal";
import { AccountCircleRounded, CalendarViewDay, Check, Close, Receipt, RecentActors } from "@material-ui/icons";
import { UserData, UserPermissions } from "../../reducers/auth.reducer";
import useAxios from "axios-hooks";
import { APIResponse, handleAxiosError } from "../Axios";
import { Redirect, useParams } from "react-router";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { RootState } from "../../reducers/rootReducer";
import { accountPaths, paths } from "../../routes/paths.enum";
import { useUsersUnderAdmin } from "../../actions/auth.actions"

const GrowableGrid = withStyles((theme: Theme) => ({
    item: {
        flexGrow: 1,
        "&:not(:first-child)": {
            minWidth: theme.breakpoints.values.sm / 3
        }
    },
}))(Grid);

const Paper = withStyles((theme: Theme) => ({
    root: {
        height: "100%"
    },
}))(BasePaper);

export default function UserEditModal() {
    const param = useParams<{ id: string }>();
    const { usersUnderUser } = useSelector((state: RootState) => state.auth);
    const userData = usersUnderUser?.find(user => user._id === param.id);
    const [newSettings, setNewSettings] = useState(userData?.settings);
    const [newPassword, setNewPassword] = useState<string>();
    const [unSavedEdits, setUnSavedEdits] = useState(false);
    const { fetchUsersUnderAdmin } = useUsersUnderAdmin();

    const [{ loading: passwordUpdateLoading, error: passwordUpdateError, data: passwordUpdateResponse }, updatePassword, reset] = useAxios<APIResponse<UserData>>(
        {
            url: `/auth/${param.id}.password`,
            method: "PUT",
            data: { value: newPassword },
        }, { manual: true }
    )

    useEffect(() => {
        if (userData) {
            setNewSettings(userData.settings);
        }
    }, [userData]);

    useEffect(() => {
        if (passwordUpdateResponse && !passwordUpdateLoading) {
            toast.success("User Password updated");
            setNewPassword(undefined);
            reset();
            fetchUsersUnderAdmin();
        }
        if (passwordUpdateError) handleAxiosError(passwordUpdateError);
        //eslint-disable-next-line
    }, [passwordUpdateLoading, passwordUpdateError, passwordUpdateResponse]);

    const [{ loading: settingsUpdateLoading, error: settingsUpdateError, data: settingsUpdateResponse }, updateSettings, resetSettingsUpdate] = useAxios<APIResponse<UserData>>(
        {
            url: `/auth/${param.id}.settings`,
            method: "PUT",
            data: { value: { ...newSettings, permissions: newSettings?.permissions.map((permission) => UserPermissions[permission]) } },
        }, { manual: true }
    )

    useEffect(() => {
        if (settingsUpdateResponse && !settingsUpdateLoading) {
            toast.success("User Settings updated");
            setUnSavedEdits(false);
            resetSettingsUpdate();
            fetchUsersUnderAdmin();
        }
        if (settingsUpdateError) handleAxiosError(settingsUpdateError);
        //eslint-disable-next-line
    }, [settingsUpdateLoading, settingsUpdateError, settingsUpdateResponse]);

    if (!userData || !newSettings) return (<Redirect to={paths.account + accountPaths.home} />);

    const hasPermission = (permission: UserPermissions) => newSettings?.permissions.includes(permission);
    const pageAccessPermissions = (permission: UserPermissions): { page: string, description: string, icon: JSX.Element } => {
        switch (permission) {
            case UserPermissions.ALLOW_PAGE_ACCOUNTS:
                return { page: "Accounts", description: "Allow User to access Accounts Page.", icon: <RecentActors /> };
            case UserPermissions.ALLOW_PAGE_BILLS:
                return { page: "Bills", description: "Allow User to access Bills Page.", icon: <Receipt /> };
            case UserPermissions.ALLOW_PAGE_CUSTOMERS:
                return { page: "Customers", description: "Allow User to access Cutomers Page.", icon: <AccountCircleRounded /> };
            case UserPermissions.ALLOW_PAGE_ITEMS:
                return { page: "Inventory", description: "Allow User to access Inventory Page.", icon: <CalendarViewDay /> };
            default:
                return { page: "", description: "Allow User to access this page.", icon: <>No icon</> }
        }
    }

    const equals = (a: UserPermissions[], b: UserPermissions[]) => {
        a = [...a].sort((a, b) => a - b);
        b = [...b].sort((a, b) => a - b);

        return a.length === b.length &&
            a.every((v, i) => v === b[i])
    };

    const togglePermission = (permission: UserPermissions) => (_event: any) => {
        const newModifiedPermissions = [...newSettings.permissions];
        const permissionIndex = newModifiedPermissions.indexOf(permission);

        if (permissionIndex >= 0) {
            newModifiedPermissions.splice(permissionIndex, 1);
        } else {
            newModifiedPermissions.push(permission);
        }

        setNewSettings((prevState: any) => {
            const newSettings = {
                ...prevState,
                permissions: newModifiedPermissions
            }
            return newSettings;
        });
        setUnSavedEdits(!equals(newModifiedPermissions, userData.settings.permissions));
    }

    return (
        <Modal title="Edit User" extraButtons={unSavedEdits ? [{ text: "Save", onClick: () => updateSettings() }] : undefined}>
            <GrowableGrid
                container
                direction="row"
                justify="center"
                alignItems="stretch"
                spacing={2}
            >
                <GrowableGrid item xs={12} md={6}>
                    <Paper>
                        <List subheader={<ListSubheader>Credentials</ListSubheader>}>
                            <ListItem alignItems="flex-start">
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
                            </ListItem>
                        </List>
                        <Divider />
                        <List subheader={<ListSubheader>Page Access</ListSubheader>}>
                            {[UserPermissions.ALLOW_PAGE_BILLS, UserPermissions.ALLOW_PAGE_CUSTOMERS, UserPermissions.ALLOW_PAGE_ITEMS]
                                .map((item, key) =>
                                    <ListItem key={key}>
                                        <ListItemIcon>
                                            {pageAccessPermissions(item).icon}
                                        </ListItemIcon>
                                        <ListItemText primary={pageAccessPermissions(item).page} />
                                        <ListItemSecondaryAction>
                                            <Switch
                                                edge="end"
                                                disabled={settingsUpdateLoading}
                                                onChange={togglePermission(item)}
                                                checked={hasPermission(item)}
                                            />
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                )
                            }
                        </List>
                    </Paper>
                </GrowableGrid>
                <GrowableGrid item xs>
                    <Paper>
                        <List subheader={<ListSubheader>Permitted Bill Actions</ListSubheader>}>
                            <ListItem dense button>
                                <ListItemIcon>
                                    <Checkbox
                                        edge="start"
                                        disabled={settingsUpdateLoading}
                                        onChange={togglePermission(UserPermissions.ALLOW_BILL_GET)}
                                        checked={hasPermission(UserPermissions.ALLOW_BILL_GET)}
                                        tabIndex={-1}
                                        disableRipple
                                    />
                                </ListItemIcon>
                                <ListItemText primary={"Get Bill(s)"} />
                            </ListItem>
                            <ListItem dense button>
                                <ListItemIcon>
                                    <Checkbox
                                        edge="start"
                                        disabled={settingsUpdateLoading}
                                        onChange={togglePermission(UserPermissions.ALLOW_BILL_POST)}
                                        checked={hasPermission(UserPermissions.ALLOW_BILL_POST)}
                                        tabIndex={-1}
                                        disableRipple
                                    />
                                </ListItemIcon>
                                <ListItemText primary={"Create Bill"} />
                            </ListItem>
                            <ListItem dense button>
                                <ListItemIcon>
                                    <Checkbox
                                        edge="start"
                                        disabled={settingsUpdateLoading}
                                        onChange={togglePermission(UserPermissions.ALLOW_BILL_DELETE)}
                                        checked={hasPermission(UserPermissions.ALLOW_BILL_DELETE)}
                                        tabIndex={-1}
                                        disableRipple
                                    />
                                </ListItemIcon>
                                <ListItemText primary={"Delete Bill"} />
                            </ListItem>
                            <ListItem dense button>
                                <ListItemIcon>
                                    <Checkbox
                                        edge="start"
                                        disabled={settingsUpdateLoading}
                                        onChange={togglePermission(UserPermissions.ALLOW_BILL_PUT)}
                                        checked={hasPermission(UserPermissions.ALLOW_BILL_PUT)}
                                        tabIndex={-1}
                                        disableRipple
                                    />
                                </ListItemIcon>
                                <ListItemText primary={"Edit Bill"} />
                            </ListItem>
                        </List>
                    </Paper>
                </GrowableGrid>
                <GrowableGrid item xs>
                    <Paper>
                        <List subheader={<ListSubheader>Permitted Inventory Actions</ListSubheader>}>
                            <ListItem dense button>
                                <ListItemIcon>
                                    <Checkbox
                                        edge="start"
                                        disabled={settingsUpdateLoading}
                                        onChange={togglePermission(UserPermissions.ALLOW_PRODUCT_GET)}
                                        checked={hasPermission(UserPermissions.ALLOW_PRODUCT_GET)}
                                        tabIndex={-1}
                                        disableRipple
                                    />
                                </ListItemIcon>
                                <ListItemText primary={"Get Product(s)"} />
                            </ListItem>
                            <ListItem dense button>
                                <ListItemIcon>
                                    <Checkbox
                                        edge="start"
                                        disabled={settingsUpdateLoading}
                                        onChange={togglePermission(UserPermissions.ALLOW_PRODUCT_POST)}
                                        checked={hasPermission(UserPermissions.ALLOW_PRODUCT_POST)}
                                        tabIndex={-1}
                                        disableRipple
                                    />
                                </ListItemIcon>
                                <ListItemText primary={"Create Product"} />
                            </ListItem>
                            <ListItem dense button>
                                <ListItemIcon>
                                    <Checkbox
                                        edge="start"
                                        disabled={settingsUpdateLoading}
                                        onChange={togglePermission(UserPermissions.ALLOW_PRODUCT_DELETE)}
                                        checked={hasPermission(UserPermissions.ALLOW_PRODUCT_DELETE)}
                                        tabIndex={-1}
                                        disableRipple
                                    />
                                </ListItemIcon>
                                <ListItemText primary={"Delete Product"} />
                            </ListItem>
                            <ListItem dense button>
                                <ListItemIcon>
                                    <Checkbox
                                        edge="start"
                                        disabled={settingsUpdateLoading}
                                        onChange={togglePermission(UserPermissions.ALLOW_PRODUCT_PUT)}
                                        checked={hasPermission(UserPermissions.ALLOW_PRODUCT_PUT)}
                                        tabIndex={-1}
                                        disableRipple
                                    />
                                </ListItemIcon>
                                <ListItemText primary={"Edit Product"} />
                            </ListItem>
                        </List>
                    </Paper>
                </GrowableGrid>
                <GrowableGrid item xs>
                    <Paper>
                        <List subheader={<ListSubheader>Permitted Customer Actions</ListSubheader>}>
                            <ListItem dense button>
                                <ListItemIcon>
                                    <Checkbox
                                        edge="start"
                                        disabled={settingsUpdateLoading}
                                        onChange={togglePermission(UserPermissions.ALLOW_CUSTOMER_GET)}
                                        checked={hasPermission(UserPermissions.ALLOW_CUSTOMER_GET)}
                                        tabIndex={-1}
                                        disableRipple
                                    />
                                </ListItemIcon>
                                <ListItemText primary={"Get Customer(s)"} />
                            </ListItem>
                            <ListItem dense button>
                                <ListItemIcon>
                                    <Checkbox
                                        edge="start"
                                        disabled={settingsUpdateLoading}
                                        onChange={togglePermission(UserPermissions.ALLOW_CUSTOMER_POST)}
                                        checked={hasPermission(UserPermissions.ALLOW_CUSTOMER_POST)}
                                        tabIndex={-1}
                                        disableRipple
                                    />
                                </ListItemIcon>
                                <ListItemText primary={"Create Customer"} />
                            </ListItem>
                            <ListItem dense button>
                                <ListItemIcon>
                                    <Checkbox
                                        edge="start"
                                        disabled={settingsUpdateLoading}
                                        onChange={togglePermission(UserPermissions.ALLOW_CUSTOMER_DELETE)}
                                        checked={hasPermission(UserPermissions.ALLOW_CUSTOMER_DELETE)}
                                        tabIndex={-1}
                                        disableRipple
                                    />
                                </ListItemIcon>
                                <ListItemText primary={"Delete Customer"} />
                            </ListItem>
                            <ListItem dense button>
                                <ListItemIcon>
                                    <Checkbox
                                        edge="start"
                                        disabled={settingsUpdateLoading}
                                        onChange={togglePermission(UserPermissions.ALLOW_CUSTOMER_PUT)}
                                        checked={hasPermission(UserPermissions.ALLOW_CUSTOMER_PUT)}
                                        tabIndex={-1}
                                        disableRipple
                                    />
                                </ListItemIcon>
                                <ListItemText primary={"Edit Customer"} />
                            </ListItem>
                        </List>
                    </Paper>
                </GrowableGrid>
            </GrowableGrid>
        </Modal>
    )
}