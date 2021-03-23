import React from 'react';
import { Grid, Typography } from '@material-ui/core';
import HomeCard from '../components/HomeCard';
import { useHistory } from 'react-router-dom';
import { paths, billsPaths, itemPaths, customersPaths } from '../routes/paths.enum';
import PageContainer from '../components/PageContainer';
import { version as appVersion } from '../../package.json';
import { useHasPermission } from '../actions/auth.actions';
import { UserPermissions } from '../reducers/auth.reducer';

export default function HomePage() {
    const history = useHistory();
    const openLink = (link: string) => () => history.push(link);

    const itemsPageAccess = useHasPermission(UserPermissions.ALLOW_PAGE_ITEMS);
    const billsPageAccess = useHasPermission(UserPermissions.ALLOW_PAGE_BILLS);
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
                {billsPageAccess
                    && <Grid item xs={12} sm={6} md={4}>
                        <HomeCard
                            onClick={openLink(paths.billsHome + billsPaths.addBill)}
                            title="New Bill"
                            content="Add new bill from a customer."
                        />
                    </Grid>
                }

                {itemsPageAccess
                    && <Grid item xs={12} sm={6} md={4}>
                        <HomeCard
                            onClick={openLink(paths.items + itemPaths.addItem)}
                            title="New Item"
                            content="Add new item to the inventory."
                        />
                    </Grid>
                }

                {customersPageAccess
                    && <Grid item xs={12} sm={6} md={4}>
                        <HomeCard
                            onClick={openLink(paths.customer + customersPaths.createCustomer)}
                            title="New Customer"
                            content="Add new customer with details like phone number and place."
                        />
                    </Grid>
                }

                {billsPageAccess
                    && <Grid item xs={12} sm={6} md={4}>
                        <HomeCard
                            onClick={openLink(paths.billsHome)}
                            title="Receive Payment"
                            content="Receive Payments for Credit Bills by searching them with customer name or serial number."
                        />
                    </Grid>
                }
                <Grid item xs={12} sm={6} md={4}>
                    <HomeCard
                        onClick={() => console.log("Everything works fine.")}
                        content={"Bills WebApp: v" + appVersion}
                    />
                </Grid>

            </Grid>
        </PageContainer>
    )
}