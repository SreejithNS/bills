import React, { useState } from 'react'
import { Theme, Grid, Typography, useMediaQuery, useTheme, Button } from '@material-ui/core';
import PageContainer from '../components/PageContainer';
import CheckInTable from '../components/CheckIn/CheckInTable';
import CheckInMap from '../components/CheckIn/CheckInMap';
import { CheckInDTO } from '../types/CheckIn';
import CheckInEntryDialog from '../components/CheckIn/CheckInEntryDialog';
import MaterialTable from 'material-table';
import { tableIcons } from '../components/MaterialTableIcons';
import PostAdd from '@material-ui/icons/PostAdd';
import { useDispatch } from 'react-redux';
import { billsPaths, paths } from '../routes/paths.enum';
import { useHistory } from 'react-router-dom';



export default function CheckInsPage() {
    const theme = useTheme();
    const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down("sm"));
    const dispatch = useDispatch();
    const history = useHistory();

    //Data
    const [data, setData] = useState<CheckInDTO[]>([]);

    // Table selected data
    const [selectedData, setSelectedData] = useState<CheckInDTO[]>([]);

    //Dialog
    const [open, setOpen] = useState(false);

    //Convert to sales Bill
    const newSalesBillFromCheckIn = ({ products, contact }: CheckInDTO) => {
        dispatch({
            type: 'BILL_FROM_CHECKIN',
            payload: {
                items: products,
                customer: contact,
            }
        });

        history.push(paths.billsHome + billsPaths.addBill);
    }

    return (
        <React.Fragment>
            <PageContainer>
                <Grid container direction="column" spacing={2} justifyContent="center" alignItems="stretch">
                    <Grid item xs={12}>
                        <Typography variant="h4">CheckIns</Typography>
                    </Grid>
                    <Grid xs={12} item direction={!isMobile ? "row" : "column-reverse"} container spacing={2} justifyContent="center" alignItems="stretch">
                        <Grid item xs={12} md={8}>
                            <CheckInTable observe={[open]} newEntry={() => setOpen(true)} onData={setData} onSelect={setSelectedData} />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            {selectedData.length === 1 && selectedData[0].products.length > 0 &&
                                <MaterialTable
                                    icons={tableIcons}
                                    style={{ marginBottom: theme.spacing(2), padding: theme.spacing(2) }}
                                    components={{
                                        // Container: props => <Paper {...props} variant="outlined" style={{ ...props.style, padding: theme.spacing(1) }} />,
                                        Toolbar: props => <Button
                                            variant="outlined"
                                            color="default"
                                            size="small"
                                            startIcon={<PostAdd />}
                                            onClick={() => newSalesBillFromCheckIn(selectedData[0])}
                                        >
                                            Convert to Sales Bill
                                        </Button>
                                    }}
                                    columns={[
                                        {
                                            title: "Item",
                                            field: "name",
                                            editable: "never"
                                        },
                                        {
                                            title: "Quantity",
                                            field: "quantity",
                                            type: "numeric",
                                            editable: "always",
                                            render: (rowData: any) => <><strong>{rowData.quantity}</strong> {rowData.unit?.length ? rowData.unit.split(" ").map((c: string) => c.charAt(0)).join("").toUpperCase() : ""}</>
                                        },
                                        {
                                            title: "Rate",
                                            field: "rate",
                                            type: "numeric",
                                            editable: "never"
                                        },
                                        {
                                            title: "Amount",
                                            field: "amount",
                                            type: "numeric",
                                            editable: "never",
                                            render: rowData => rowData.quantity * rowData.rate
                                        }
                                    ]}
                                    data={selectedData[0].products ?? []}
                                    options={{
                                        search: false,
                                        paging: false,
                                        toolbar: true,
                                        padding: "dense"
                                    }}
                                />}
                            <CheckInMap data={selectedData.length > 0 ? selectedData : data} />
                        </Grid>
                    </Grid>
                </Grid>
                <CheckInEntryDialog title="Add a new CheckIn" onClose={() => setOpen(false)} open={open} />
            </PageContainer>
        </React.Fragment >
    )
}