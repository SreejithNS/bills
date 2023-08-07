import React, { ChangeEvent } from 'react'
import { useState } from 'react';
import _ from "lodash";
import { AreaChart, Tooltip as ChartTooltip, Area, ResponsiveContainer, XAxis, Line, LineChart, Label } from 'recharts';
import MaterialTable, { MTableToolbar } from 'material-table';
import { Typography, List, ListItem, ListItemIcon, ListItemText, Divider, Paper, Grid, makeStyles, createStyles, Theme, Dialog, DialogTitle, DialogContent, DialogActions, Button, useTheme, useMediaQuery, ButtonGroup, Box, DialogContentText, TextField, InputAdornment, ButtonGroupProps, Tooltip, ListSubheader } from '@material-ui/core';
import PageContainer from '../components/PageContainer';
import ThreeColumn from '../components/Layouts/ThreeColumn';
import Inbox from '@material-ui/icons/Inbox';
import Mail from '@material-ui/icons/Mail';
import { useSelector } from 'react-redux';
import { RootState } from '../reducers/rootReducer';
import { tableIcons, PatchedPagination } from '../components/MaterialTableIcons';
import usePromise from "react-use-promise";
import { fetchBills } from '../actions/analytics.action';
import { DateRangePicker, DateRangePickerProps } from 'react-date-range';
import moment from "moment";
import WrappedSkeleton from '../components/Layouts/WrappedSkeleton';
import ArrowDropDownIcon from "@material-ui/icons/ArrowDropDown";
import RetryIcon from "@material-ui/icons/Refresh"
import { Autocomplete } from '@material-ui/lab';
import { UserData } from '../reducers/auth.reducer';
import logo from "../assets/logo.svg";

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        tableTopStat: {
            marginRight: theme.spacing(1),
        },
        tableTop: {
            marginBottom: theme.spacing(1),
        },
        paper: {
            padding: theme.spacing(3),
            borderRadius: theme.spacing(2),
            "&>*": {
                marginBottom: theme.spacing(2),
            }
        },
        tablePaper: {
            padding: theme.spacing(0),
            border: "none"
        },
    }));

function groupByMonthYear(data: Record<any, any>): any[] {
    const yearMonth = (date: Date) => moment(new Date(date)).format("MMM-YY")
    const keyedByYearMonth = _.groupBy(data, ({ createdAt }) => yearMonth(createdAt));
    return Object.entries(keyedByYearMonth).reduce((acc: any[], curr: [any, any]) => {
        const key = curr.shift();
        const items = curr.pop();
        return [
            ...acc,
            {
                group: key,
                billAmount: _.sumBy(items, 'billAmount'),
                billCount: items.length
            }
        ]
    }, [])
}

function DateRangePickerDialog({ dialogOpen = false, buttonGroupProps, ...rest }: { buttonGroupProps?: ButtonGroupProps; dialogOpen?: boolean } & DateRangePickerProps) {
    const [open, setOpen] = React.useState(dialogOpen);
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

    return (
        <>
            <ButtonGroup size="small" variant="outlined" {...buttonGroupProps}>
                <Button onClick={() => setOpen(true)}>
                    From {moment(rest.ranges![0]!.startDate).format("MMMM Do YYYY")} {rest.ranges![0]!.endDate ? `to ${moment(rest.ranges![0]!.endDate).format("MMMM Do YYYY")}` : ""}
                </Button>
                <Button
                    onClick={() => setOpen(true)}
                >
                    <ArrowDropDownIcon />
                </Button>
            </ButtonGroup>
            <Dialog
                fullScreen={fullScreen}
                open={open}
                onClose={() => setOpen(false)}
            >
                <DialogTitle>{"Pick a date range"}</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        <DateRangePicker {...rest} />
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)} color="primary">
                        Close
          </Button>
                </DialogActions>
            </Dialog>
        </>
    )
}

function AnalyticsPage() {
    const { userData, usersUnderUser } = useSelector((state: RootState) => state.auth);
    const { tableTopStat, paper, tableTop, tablePaper } = useStyles();
    const [refetchFlag, setRefetchFlag] = React.useState(false);
    const [salesmen, setSalesmen] = React.useState<UserData[]>([]);
    const [state, setState] = useState({
        selection: {
            startDate: new Date(),
            endDate: new Date(),
            key: 'selection'
        }
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [response, _error, responseState] = usePromise(() => fetchBills({
        createdAt: {
            $gt: state.selection.startDate,
            $lte: state.selection.endDate ?? new Date()
        },
        ...(salesmen.length && {
            soldBy: {
                $in: salesmen.map((eachSaleman) => eachSaleman._id)
            }
        })
    }), [refetchFlag, state, salesmen])

    const data: {
        customer: { name: string; _id: string };
        soldBy: { _id: string };
        paidAmount: number;
        billAmount: number;
        createdAt: string;
        credit: string;
    }[] = response?.data.map((bill: { soldBy: any; credit: boolean; createdAt: Date }) => {
        return {
            ...bill,
            soldBy: [...usersUnderUser as any[], userData].find(salesman => salesman._id === bill.soldBy)?.name ?? bill.soldBy,
            credit: bill.credit ? "IN CREDIT" : "CLOSED",
            createdAt: moment(bill.createdAt).format('L')
        }
    }) ?? [];
    const customers: Map<string, number> = data.map(bill => `${bill.customer._id}::${bill.customer.name}`).reduce((acc, e) => acc.set(e, (acc.get(e) || 0) + 1), new Map())
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const soldBy: Map<string, number> = data.map(bill => `${bill.soldBy._id}`).reduce((acc, e) => acc.set(e, (acc.get(e) || 0) + 1), new Map());
    const cashIn: number = data.map(bill => bill.paidAmount).reduce((acc, e) => acc + e, 0);
    const totalBilled: number = data.map(bill => bill.billAmount).reduce((acc, e) => acc + e, 0);
    const days: Map<string, number> = data.map(bill => moment(new Date(bill.createdAt)).format("L")).reduce((acc, e) => acc.set(e, (acc.get(e) || 0) + 1), new Map())
    return (
        <PageContainer>
            <ThreeColumn navigation={<>
                <Box display="flex" justifyContent="flex-start" alignItems="center">
                    <img src={logo} style={{ width: "48px", marginRight: 12 }} alt="Billz Logo" />
                    <Box mt={1}>
                        <Typography component="div" variant="h5">
                            BillzApp
                            <Typography component="div" variant="subtitle2" style={{ marginTop: -8 }}>Analytics</Typography>
                        </Typography>
                    </Box>
                </Box>
                <List>
                    <ListSubheader>Data Categories</ListSubheader>
                    {['Bills'].map((text, index) => (
                        <ListItem button key={text}>
                            <ListItemIcon>{index % 2 === 0 ? <Inbox /> : <Mail />}</ListItemIcon>
                            <ListItemText primary={text} />
                        </ListItem>
                    ))}
                </List>
                <Divider />
                <List>
                    <ListItemText secondary={"All these are still in development"} />
                </List>
            </>}>
                <Typography style={{ marginTop: 8 }} variant="h4">Hi, {userData?.name}</Typography>
                <Paper className={paper}>
                    <Grid container wrap="wrap" justifyContent="flex-start" className={tableTop} spacing={2}>
                        <Grid item className={tableTopStat}>
                            <div>Total Bills</div>
                            <Typography variant="h4">
                                <WrappedSkeleton width={150} loading={responseState === "pending"}>
                                    {data.length}
                                </WrappedSkeleton>
                            </Typography>
                            <Typography variant="caption">
                                <WrappedSkeleton width={200} loading={responseState === "pending"}>
                                    From {moment(state.selection.startDate).fromNow()} {state.selection.endDate ? `to ${moment(state.selection.endDate).fromNow()}` : ""}
                                </WrappedSkeleton>
                            </Typography>
                        </Grid>
                        <Grid item className={tableTopStat}>
                            <div>Reached</div>
                            <Typography variant="h4">
                                <WrappedSkeleton width={200} loading={responseState === "pending"}>
                                    {customers.size}
                                </WrappedSkeleton>
                            </Typography>
                            <Typography variant="caption">
                                <WrappedSkeleton width={100} loading={responseState === "pending"}>
                                    Customers in {days.size + 1} days
                                 </WrappedSkeleton>
                            </Typography>
                        </Grid>
                        <Grid item className={tableTopStat}>
                            <div>Cash In</div>
                            <Typography variant="h4">
                                <WrappedSkeleton width={200} loading={responseState === "pending"}>
                                    {cashIn.toINR()}
                                </WrappedSkeleton>
                            </Typography>
                            <Typography variant="caption">
                                <WrappedSkeleton width={100} loading={responseState === "pending"}>
                                    out of {totalBilled.toINR()}
                                </WrappedSkeleton>
                            </Typography>
                        </Grid>
                        <Grid item xs={6} className={tableTopStat}>
                            <ResponsiveContainer>
                                <AreaChart data={groupByMonthYear(data)}>
                                    <XAxis dataKey="group" />
                                    <ChartTooltip />
                                    <Area type="monotone" dataKey="billAmount" stroke="#8884d8" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </Grid>
                        <Grid item xs={6} className={tableTopStat}>
                            <ResponsiveContainer>
                                <LineChart data={groupByMonthYear(data)}>
                                    <XAxis dataKey="group" />
                                    <ChartTooltip />
                                    <Line type="monotone" dataKey="billCount" stroke="#82ca9d" />
                                </LineChart>
                            </ResponsiveContainer>
                        </Grid>
                    </Grid>
                    <Divider />
                    <MaterialTable icons={tableIcons}
                        title={`BillzApp - Bill Data from ${moment(state.selection.startDate).format("DD-MM-YY")} to ${moment(state.selection.endDate ?? new Date()).format("DD-MM-YY")}`}
                        components={{
                            Pagination: PatchedPagination,
                            Container: props => <Paper className={tablePaper} {...props} variant="outlined" />,
                            Toolbar: props => {
                                return (<Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap">
                                    <Autocomplete
                                        options={usersUnderUser && userData ? [...usersUnderUser, userData] : []}
                                        getOptionLabel={(option) => option!.name}
                                        size="small"
                                        value={salesmen}
                                        multiple
                                        style={{ flexGrow: 1, flexShrink: 0, flexBasis: "50%", marginRight: 8 * 2 }}
                                        onChange={(_, value) => setSalesmen(value)}
                                        renderInput={(params) =>
                                            <TextField {...params} variant="outlined" label="Salesmen" />}
                                    />
                                    <TextField
                                        label="Search"
                                        size="small"
                                        variant="outlined"
                                        style={{ flexShrink: 1 }}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Tooltip title="Tip: You can also search Customers by their phone number">
                                                        {(tableIcons.Search && <tableIcons.Search />) || <></>}
                                                    </Tooltip>
                                                </InputAdornment>
                                            ),
                                        }} value={props.searchText} onChange={(e) => {
                                            _.debounce((e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                                            }, 1000)(e)
                                            props.onSearchChanged(e.target.value);
                                            props.dataManager.changeSearchText(e.target.value);
                                        }
                                        } />
                                    <DateRangePickerDialog
                                        onChange={item => setState({ ...state, ...item })}
                                        maxDate={new Date()}
                                        direction="horizontal"
                                        ranges={[state.selection]}
                                        buttonGroupProps={{
                                            style: {
                                                flexGrow: 1,
                                                flexShrink: 0,
                                                flexBasis: "50%"
                                            },
                                        }}
                                    />
                                    <Box flexGrow="1"><MTableToolbar {...props} /></Box>
                                </Box>)
                            },
                        }}
                        style={{ verticalAlign: 'top' }}
                        columns={[
                            { title: 'Customer', field: "customer.name" },
                            { title: 'Serial No.', field: 'serialNumber', type: "numeric", hiddenByColumnsButton: true },
                            {
                                title: 'Salesman', field: 'soldBy'
                            },
                            {
                                title: "Credit", field: "credit", hidden: true, searchable: false, export: true
                            },
                            {
                                title: 'Billing Date', field: 'createdAt', type: 'datetime', filtering: true, dateSetting: {
                                    locale: "en-gb"
                                }
                            },
                            { title: "Customer Phone", field: "customer.phone", hidden: true, searchable: true },
                            { title: "Total Amount", field: "itemsTotalAmount", type: "numeric", export: true, hidden: true, searchable: false },
                            { title: "Discount", field: "discountAmount", type: "numeric", export: true, hidden: true, searchable: false },
                            {
                                title: "Paid Amount", field: "paidAmount", searchable: false, type: "currency", currencySetting: {
                                    currencyCode: "INR",
                                    locale: "EN-GB",
                                    maximumFractionDigits: 2,
                                    minimumFractionDigits: 0,
                                }, export: true, hidden: true
                            },
                            {
                                title: "Bill Amount", field: "billAmount", searchable: true, type: "currency", currencySetting: {
                                    currencyCode: "INR",
                                    locale: "EN-GB",
                                    maximumFractionDigits: 2,
                                    minimumFractionDigits: 0,
                                }
                            }
                        ]}
                        data={data}
                        isLoading={responseState === "pending"}
                        options={{
                            padding: "default",
                            selection: true,
                            showTitle: false,
                            searchAutoFocus: true,
                            search: false,
                            exportAllData: true,
                            exportButton: true,
                            exportFileName: `BillzApp Bill Data ${moment(state.selection.startDate).format("DD/MM/YYYY")} - ${moment(state.selection.endDate ?? new Date()).format("DD/MM/YYYY")}`
                        }}
                        actions={[
                            {
                                tooltip: 'Refresh',
                                icon: () => <RetryIcon />,
                                isFreeAction: true,
                                onClick: () => setRefetchFlag((current) => !current)
                            }
                        ]}
                    />
                </Paper>

            </ThreeColumn>
        </PageContainer>
    )
}

export default AnalyticsPage;