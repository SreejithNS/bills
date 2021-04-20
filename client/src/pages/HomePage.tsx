import React from 'react';
import { Box, Grid, Typography } from '@material-ui/core';
import HomeCard from '../components/HomeCard';
import { useHistory } from 'react-router-dom';
import { paths, billsPaths, itemPaths, customersPaths } from '../routes/paths.enum';
import PageContainer from '../components/PageContainer';
import { version as appVersion } from '../../package.json';
import { useHasPermission } from '../actions/auth.actions';
import { UserPermissions } from '../reducers/auth.reducer';
import { Receipt } from '@material-ui/icons';
import PostAddIcon from '@material-ui/icons/PostAdd';
import PersonAddIcon from '@material-ui/icons/PersonAdd';
import HelpIcon from '@material-ui/icons/Help';

export default function HomePage() {
    const history = useHistory();
    const openLink = (link: string) => () => history.push(link);

    const itemsPageAccess = useHasPermission(UserPermissions.ALLOW_PAGE_ITEMS);
    const createItemAccess = useHasPermission(UserPermissions.ALLOW_PRODUCT_POST);
    const billsPageAccess = useHasPermission(UserPermissions.ALLOW_PAGE_BILLS);
    const createBillAccess = useHasPermission(UserPermissions.ALLOW_BILL_POST);
    const customersPageAccess = useHasPermission(UserPermissions.ALLOW_PAGE_CUSTOMERS);

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
                    <Typography variant="h4">
                        Good Day!
                            </Typography>
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
                            title="Receive Payment"
                            content="Receive Payments for Credit Bills by searching them with customer name or serial number."
                        />
                    </Grid>
                }
                <Grid item xs={12} sm={6} md={4}>
                    <HomeCard
                        icon={<HelpIcon fontSize="large" />}
                        onClick={() => console.log("Everything works fine.")}
                        content={"Bills WebApp: v" + appVersion}
                    />
                </Grid>
            </Grid>
        </PageContainer>
    )
}