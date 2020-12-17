import * as React from 'react'
import { Fab, Grid, Theme, withStyles, WithStyles, createStyles, Typography, List, ListItem, ListItemText } from '@material-ui/core';
import { connect } from 'react-redux';
import AddIcon from '@material-ui/icons/Add';
import { compose } from 'redux';
import { RouteComponentProps, withRouter } from 'react-router-dom';
import { itemPaths, paths } from '../routes/paths.enum';
import MaterialTable from 'material-table';
import { tableIcons } from '../components/MaterialTableIcons';
import { fetchItemsList } from '../actions/item.actions';
import Axios from 'axios';
import { toast } from 'react-toastify';
import { Add, LineStyleTwoTone, Refresh } from '@material-ui/icons';
import PageContainer from '../components/PageContainer';
import LineStyleIcon from '@material-ui/icons/LineStyle';

type Props = ReturnType<typeof mapDispatchToProps> & ReturnType<typeof mapStateToProps> & WithStyles<typeof styles> & RouteComponentProps;

const styles = (theme: Theme) => createStyles({
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

class ItemsHomePage extends React.Component<Props> {
    componentDidMount() {
        //this.props.getItemsList();
    }
    tableRef = React.createRef<{ onQueryChange(): void }>();
    render() {
        const { classes, history } = this.props;
        return (
            <React.Fragment>
                <PageContainer>
                    <Grid
                        container
                        justify="center"
                        alignItems="flex-start"
                        spacing={2}
                    >
                        <Grid item xs={12}>
                            <Typography variant="h4">
                                Inventory
                            </Typography>
                        </Grid>
                        <Grid item xs={12} className={classes.cardPadding}>
                            <MaterialTable
                                tableRef={this.tableRef}

                                icons={tableIcons}
                                //isLoading={itemsListLoad}
                                columns={[
                                    { title: "Item Name", field: "name", editable: "never" },
                                    { title: "Code", field: "code", editable: "never" },
                                    { title: "Rate", field: "rate", type: "numeric", editable: "never" },
                                    { title: "MRP", field: "mrp", type: "numeric", editable: "never" },
                                ]}

                                data={query =>
                                    new Promise((resolve, reject) => {
                                        // prepare your data and then call resolve like this:
                                        const queryString = new URL(process.env.REACT_APP_API_URL + "/api/product/query/");
                                        queryString.searchParams.append("page", (query.page + 1).toString());
                                        queryString.searchParams.append("limit", query.pageSize.toString());
                                        queryString.searchParams.append("search", query.search);
                                        queryString.searchParams.append("sort", `${query.orderDirection === 'desc' ? "-" : ""}${query.orderBy?.field || ""}`);
                                        Axios
                                            .get(queryString.toString(), { withCredentials: true })
                                            .then(function (response) {
                                                const responseData = response.data.data

                                                resolve({
                                                    data: responseData.docs,
                                                    page: responseData.page - 1,
                                                    totalCount: responseData.totalDocs
                                                });
                                            })
                                            .catch(function (error) {
                                                toast.error("Items List Error:" + error.message);
                                                reject(error)
                                            })
                                    })
                                }
                                actions={[
                                    {
                                        icon: () => <Refresh />,
                                        tooltip: 'Refresh Data',
                                        isFreeAction: true,
                                        onClick: () => this.tableRef.current && this.tableRef.current.onQueryChange(),
                                    },
                                    {
                                        icon: () => <Add />,
                                        tooltip: 'Add Item',
                                        isFreeAction: true,
                                        onClick: () => history.push(paths.items + itemPaths.addItem)
                                    }
                                ]}
                                options={{
                                    exportButton: false,
                                    exportCsv: (columns, data) => {
                                        console.log(data)
                                        alert('You should develop a code to export ' + data.length + ' rows');
                                    },
                                    toolbarButtonAlignment: "left",
                                    showTitle: false
                                }}
                                detailPanel={[{
                                    icon: LineStyleIcon,
                                    openIcon: LineStyleTwoTone,
                                    tooltip: 'Show Units',
                                    render: (rowData: { units?: any[] }) => {
                                        return (rowData.units && rowData.units.length) ? (
                                            <List dense>
                                                {rowData.units.map((unit: { name: string; rate: number; mrp: number; }, key) =>
                                                    <ListItem key={key}>
                                                        <ListItemText
                                                            primary={unit.name.toUpperCase()}
                                                            secondary={`MRP:₹${unit.mrp} RATE:₹${unit.rate}`}
                                                        />
                                                    </ListItem>,
                                                )}
                                            </List>
                                        ) : <></>
                                    }
                                }]}
                            />
                        </Grid>
                    </Grid>
                </PageContainer>
                <Fab onClick={() => this.props.history.push(paths.items + itemPaths.addItem)} className={classes.fab} color="primary" variant="extended">
                    <AddIcon className={classes.fabIcon} />
                        Add Item
                </Fab>
            </React.Fragment >
        )
    }
}

const mapStateToProps = (state: any) => {
    return {
        itemsList: state.item.itemsList,
        itemsListHasNextPage: state.item.itemsListHasNextPage,
        itemsListLoad: state.item.itemsListLoad
    }
};

const mapDispatchToProps = (dispatch: any) => {
    return {
        getItemsList: (extraItems?: boolean) => dispatch(fetchItemsList(extraItems))
    }
};

export default compose(withRouter, withStyles(styles), connect(mapStateToProps, mapDispatchToProps))(ItemsHomePage) as React.ComponentType;