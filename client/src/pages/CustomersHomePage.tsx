import React, { useRef } from 'react';
import { Fab, Grid, makeStyles, Theme, Typography } from '@material-ui/core';
import { customersPaths, paths } from '../routes/paths.enum';
import { useHistory } from 'react-router-dom';
import AddIcon from '@material-ui/icons/Add';
import { Add, Pageview, PageviewOutlined, Refresh } from '@material-ui/icons';
import PageContainer from '../components/PageContainer';
import { store } from '..';
import MaterialTable, { Query, QueryResult } from 'material-table';
import { Customer } from '../reducers/customer.reducer';
import { APIResponse, axios, handleAxiosError, interpretMTQuery } from '../components/Axios';
import { PaginateResult } from '../reducers/bill.reducer';
import { tableIcons } from '../components/MaterialTableIcons';

const useStyles = makeStyles((theme: Theme) => ({
    fab: {
        position: "fixed",
        right: theme.spacing(2),
        bottom: parseInt(theme.mixins.toolbar.minHeight + "") + theme.spacing(2),
        transition: theme.transitions.easing.easeIn
    },
    fabIcon: {
        marginRight: theme.spacing(1)
    },
    cardPadding: {
        padding: theme.spacing(1),
        "&:last-of-type": {
            marginBottom: parseInt(theme.mixins.toolbar.minHeight + "") + theme.spacing(8)
        }
    }
})
)

const CustomersTable = () => {
    const history = useHistory();
    const tableRef = useRef<any>(null);

    store.subscribe(() => {
        tableRef?.current?.onQueryChange();
    })

    const fetchItems = (query: Query<Customer>): Promise<QueryResult<Customer>> => new Promise((resolve) => {
        const url = `/customer/query?`;
        const search = (new URLSearchParams(interpretMTQuery(query))).toString();
        axios
            .get<APIResponse<PaginateResult<Customer>>>(url + search)
            .then(function ({ data: responseData }) {
                if (responseData.data)
                    resolve({
                        data: responseData.data.docs,
                        page: responseData.data.page - 1,
                        totalCount: responseData.data.totalDocs
                    });
            })
            .catch(handleAxiosError)
    })

    return (
        <MaterialTable
            tableRef={tableRef}
            icons={tableIcons}
            columns={[
                { title: "Customer Name", field: "name", editable: "never" },
                { title: "Phone Number", field: "phone", type: "numeric", sorting: false, editable: "never" },
                { title: "Place", field: "place", editable: "never" }
            ]}
            data={fetchItems}
            actions={[
                {
                    icon: () => <Refresh />,
                    tooltip: 'Refresh Data',
                    isFreeAction: true,
                    onClick: () => tableRef?.current?.onQueryChange(),
                },
                {
                    icon: () => <Add />,
                    tooltip: 'Add Customer',
                    isFreeAction: true,
                    onClick: () => history.push(paths.customer + customersPaths.createCustomer)
                },
                {
                    icon: () => <Pageview />,
                    tooltip: 'Show Details',
                    isFreeAction: false,
                    onClick: (_, data: any) => {
                        history.push((paths.customer + customersPaths.customerViewer).replace(":id", data._id))
                    }
                }
            ]}
            options={{
                exportButton: false,
                toolbarButtonAlignment: "left",
                showTitle: false
            }}
        />
    )
}

export default function CustomerHomePage() {
    const history = useHistory();
    const classes = useStyles();
    return (
        <>
            <PageContainer>
                <Grid
                    container
                    direction="row"
                    justify="flex-start"
                    alignItems="center"
                    spacing={2}
                >
                    <Grid item xs={12}>
                        <Typography variant="h4">
                            Your Customers
                            </Typography>
                    </Grid>
                    <Grid item xs={12}>
                        <CustomersTable />
                    </Grid>
                </Grid>
            </PageContainer>
            <Fab onClick={() => history.push(paths.customer + customersPaths.createCustomer)} className={classes.fab} color="primary" variant="extended">
                <AddIcon className={classes.fabIcon} /> Add Customer
            </Fab>
        </>
    )
}