import React from 'react';
import { Fab, Grid, makeStyles, Theme, Typography } from '@material-ui/core';
import { customersPaths, paths } from '../routes/paths.enum';
import { useHistory, useLocation } from 'react-router-dom';
import AddIcon from '@material-ui/icons/Add';
import RetryIcon from "@material-ui/icons/Refresh";
import Add from '@material-ui/icons/Add';
import Delete from '@material-ui/icons/Delete';
import Edit from '@material-ui/icons/Edit';
import Pageview from '@material-ui/icons/Pageview';
import PageContainer from '../components/PageContainer';
import MaterialTable from 'material-table';
import { tableIcons } from '../components/MaterialTableIcons';
import { useConfirm } from 'material-ui-confirm';
import { toast } from 'react-toastify';
// import useAxios from 'axios-hooks';
import usePromise from 'react-use-promise';
import { fetchCustomers } from '../actions/analytics.action';
import { axios, handleAxiosError } from '../components/Axios';

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

// const useCustomersData = (query: Record<string, string>) => {
//     const url = `/customer/query?`;
//     let search = new URLSearchParams(query);

//     const [{ data, error, loading }, refetch] = useAxios<APIResponse<PaginateResult<Customer>>>({
//         url,
//         params: search,
//     })

//     React.useEffect(() => {
//         if (error) {
//             handleAxiosError(error);
//         }
//     }, [error])

//     if (data?.data) data.data.page = (data.data.page * 1) - 1;

//     return {
//         data,
//         loading,
//         refetch
//     }
// }

const CustomersTable = () => {
    const history = useHistory();
    const confirm = useConfirm();

    const { search } = useLocation();
    const page = React.useMemo(() => new URLSearchParams(search).get("page"), [search]);
    const changePage = React.useCallback((page: number) => {
        const newUrlParam = new URLSearchParams({ page: page.toString() });
        history.push(history.location.pathname + "?" + newUrlParam);
    }, [history])

    const [refetchFlag, setRefetchFlag] = React.useState(false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [response, _error, responseState] = usePromise(() => fetchCustomers(), [refetchFlag])

    const data = response?.data;
    console.log('%c' + responseState, 'background: #222; color: #bada55')
    return responseState !== "pending" ?
        (<MaterialTable
            key={"primary_" + Date.now()}
            icons={tableIcons}
            columns={[
                { title: "Customer Name", field: "name", editable: "never" },
                { title: "Phone Number", field: "phone", type: "numeric", sorting: false, editable: "never" },
                { title: "Place", field: "place", editable: "never" }
            ]}
            data={data}
            page={parseInt(page ?? "")}
            onChangePage={changePage}
            actions={[
                {
                    tooltip: 'Refresh',
                    icon: () => <RetryIcon />,
                    isFreeAction: true,
                    onClick: () => setRefetchFlag((current) => !current)
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
                },
                {
                    icon: () => <Delete />,
                    tooltip: 'Delete',
                    isFreeAction: false,
                    onClick: (_, data: any) => {
                        confirm({
                            title: "Are you sure?",
                            description: "Deleting a customer will delete all the bills of that customer too. This operation undo-able. Are you sure you want to continue deleting this customer?",
                            confirmationText: "Delete",
                            confirmationButtonProps: { color: "secondary" },
                        }).then(() => axios.delete(`/customer/${data._id}`).catch(handleAxiosError))
                            .then(() => toast.success("Customer Deleted"));
                    }
                },
                {
                    icon: () => <Edit />,
                    tooltip: 'Edit Details',
                    isFreeAction: false,
                    onClick: (_, data: any) => {
                        history.push((paths.customer + customersPaths.customerEditor).replace(":customerId", data._id))
                    }
                },
            ]}
            options={{
                exportButton: false,
                toolbarButtonAlignment: "left",
                showTitle: false,
                initialPage: parseInt(page ?? "")
            }}
        />
        ) : <MaterialTable
            key={"placeholder_" + Date.now()}
            icons={tableIcons}
            data={[]}
            columns={[
                { title: "Customer Name", field: "name", editable: "never" },
                { title: "Phone Number", field: "phone", type: "numeric", sorting: false, editable: "never" },
                { title: "Place", field: "place", editable: "never" }
            ]}
            isLoading={true}
            options={{
                showTitle: false,
            }}
        />
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