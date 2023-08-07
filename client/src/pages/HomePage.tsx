import React from 'react';
import { Box, Grid, IconButton, List, ListItem, ListItemSecondaryAction, ListItemText, Typography } from '@material-ui/core';
import HomeCard from '../components/HomeCard';
import { useHistory } from 'react-router-dom';
import { paths, billsPaths, itemPaths, customersPaths, accountPaths } from '../routes/paths.enum';
import PageContainer from '../components/PageContainer';
import { version as appVersion } from '../../package.json';
import { useHasPermission } from '../actions/auth.actions';
import { UserPermissions } from '../reducers/auth.reducer';
import Receipt from '@material-ui/icons/Receipt';
import Room from '@material-ui/icons/Room';
import PostAddIcon from '@material-ui/icons/PostAdd';
import PersonAddIcon from '@material-ui/icons/PersonAdd';
import TimelineIcon from '@material-ui/icons/Timeline';
import AssessmentIcon from '@material-ui/icons/Assessment';
import { useSelector } from 'react-redux';
import { RootState } from '../reducers/rootReducer';
import AccountCircleRoundedIcon from "@material-ui/icons/AccountCircleRounded";
import SystemUpdateIcon from '@material-ui/icons/SystemUpdate';
import logo from "../assets/logo.svg";
import CheckInEntryDialog from '../components/CheckIn/CheckInEntryDialog';

export default function HomePage() {
    const history = useHistory();
    const openLink = (link: string) => () => history.push(link);
    const [open, setOpen] = React.useState(false);
    const update = () => {
        const local = localStorage.getItem("updateAvailable");
        if (local && appVersion === local) {
            return { text: "Close and reopen the app to update.", updateAvailable: true }
        } else {
            if (local) localStorage.removeItem("updateAvailable");
            return { text: "Latest Version", updateAvailable: false }
        }
    }

    const { userData, organistaionData } = useSelector((state: RootState) => state.auth);

    const itemsPageAccess = useHasPermission(UserPermissions.ALLOW_PAGE_ITEMS);
    const createItemAccess = useHasPermission(UserPermissions.ALLOW_PRODUCT_POST);
    const billsPageAccess = useHasPermission(UserPermissions.ALLOW_PAGE_BILLS);
    const createBillAccess = useHasPermission(UserPermissions.ALLOW_BILL_POST);
    const customersPageAccess = useHasPermission(UserPermissions.ALLOW_PAGE_CUSTOMERS);
    const createCheckinAccess = useHasPermission(UserPermissions.ALLOW_CHECKIN_POST);
    const checkInPageAccess = useHasPermission(UserPermissions.ALLOW_PAGE_CHECKINS);
    const hasAdminPermissions = useHasPermission();

    return (
        <PageContainer>
            <Grid
                container
                direction="row"
                justify="center"
                alignItems="stretch"
                spacing={2}
            >
                <Grid item xs={12}>
                    <List disablePadding>
                        <ListItem disableGutters dense>
                            <ListItemText
                                primary={<>
                                    <Typography variant="body1" color="textSecondary" component="div" display="block">
                                        Billz
                                    </Typography>
                                    <Typography variant="h4" component="div" display="block">
                                        {organistaionData?.name}
                                    </Typography></>}
                                secondary={<Typography variant="body1" color="textSecondary" component="span" display="block">
                                    Hi, {userData?.name}
                                </Typography>}
                            />
                            <ListItemSecondaryAction>
                                <IconButton edge="end" aria-label="account" size="medium" onClick={() => history.push(paths.account + accountPaths.home)}>
                                    <AccountCircleRoundedIcon fontSize="large" />
                                </IconButton>
                            </ListItemSecondaryAction>
                        </ListItem>
                    </List>
                </Grid>
                {billsPageAccess && createBillAccess
                    && <Grid item xs={12} sm={6} md={4}>
                        <HomeCard
                            icon={<Receipt fontSize="large" />}
                            onClick={openLink(paths.billsHome + billsPaths.addBill)}
                            title="New Bill"
                            content="Add new bill from a customer."
                        />
                    </Grid>
                }

                {itemsPageAccess && createItemAccess
                    && <Grid item xs={12} sm={6} md={4}>
                        <HomeCard
                            icon={<PostAddIcon fontSize="large" />}
                            onClick={openLink(paths.items + itemPaths.addItem)}
                            title="New Item"
                            content="Add new item to the inventory."
                        />
                    </Grid>
                }

                {customersPageAccess
                    && <Grid item xs={12} sm={6} md={4}>
                        <HomeCard
                            icon={<PersonAddIcon fontSize="large" />}
                            onClick={openLink(paths.customer + customersPaths.createCustomer)}
                            title="New Customer"
                            content="Add new customer with details like phone number and place."
                        />
                    </Grid>
                }

                {billsPageAccess
                    && <Grid item xs={12} sm={6} md={4}>
                        <HomeCard
                            icon={<Box fontSize="2.1875rem" width="2.1875rem" textAlign="center">₹</Box>}
                            onClick={openLink(paths.billsHome)}
                            title="Bills and Payments"
                            content="Receive Payments for Credit Bills by searching them with customer name or serial number."
                        />
                    </Grid>
                }

                {createCheckinAccess
                    && <Grid item xs={12} sm={6} md={4}>
                        <HomeCard
                            icon={<Room fontSize="large" />}
                            onClick={() => setOpen(true)}
                            title="Add a CheckIn"
                            content="Create a CheckIn record. Make sure your location is turned on for this."
                        />
                    </Grid>
                }

                {checkInPageAccess
                    && <Grid item xs={12} sm={6} md={4}>
                        <HomeCard
                            icon={<Room fontSize="large" />}
                            onClick={openLink(paths.checkIn)}
                            title="Browse CheckIn"
                            content="Browse your CheckIn Records and visualise in on maps."
                        />
                    </Grid>
                }

                {hasAdminPermissions
                    && <Grid item xs={12} sm={6} md={4}>
                        <HomeCard
                            icon={<AssessmentIcon fontSize="large" />}
                            onClick={openLink(paths.billsHome + billsPaths.exportBills)}
                            title="Reports"
                            content="Get customised reports from Bills generated and Products sold."
                        />
                    </Grid>
                }

                {hasAdminPermissions
                    && <Grid item xs={12} sm={6} md={4}>
                        <HomeCard
                            icon={<TimelineIcon fontSize="large" />}
                            onClick={openLink(paths.analytics)}
                            title="Analytics"
                            content="View improved analytics and reports."
                        />
                    </Grid>
                }

                <Grid item xs={12} sm={6} md={4}>
                    <HomeCard
                        icon={update().updateAvailable ? <SystemUpdateIcon color="primary" fontSize="large" /> :
                            <img src={logo} style={{ width: "48px" }} alt="Billz Logo" />}
                        {...(update().updateAvailable && { title: "Update Available" })}
                        onClick={() => {
                            console.log("Everything works fine", update())
                            //eslint-disable-next-line
                            if (update().updateAvailable) window.location.reload(true);
                        }}
                        content={<>Billz Web App: v{appVersion}<br />{update().text}</>}
                    />
                </Grid>
            </Grid>
            <CheckInEntryDialog title="Add a new CheckIn" onClose={() => setOpen(false)} open={open} />
        </PageContainer>
    )
}