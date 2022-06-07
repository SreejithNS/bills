import React, { useState } from 'react'
import { Theme, makeStyles, Box, Grid, Typography, useMediaQuery } from '@material-ui/core';
import PageContainer from '../components/PageContainer';
import CheckInTable from '../components/CheckIn/CheckInTable';
import CheckInMap from '../components/CheckIn/CheckInMap';
import { CheckInDTO } from '../types/CheckIn';
import CheckInEntryDialog from '../components/CheckIn/CheckInEntryDialog';

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
        padding: theme.spacing(2),
        // "&:last-of-type": {
        //     marginBottom: parseInt(theme.mixins.toolbar.minHeight + "") + theme.spacing(8)
        // }
    },
    flexContainer: {
        display: "flex",
        flexFlow: "row nowrap",
        alignContent: "center",
        overflowX: "auto",
        "&>*": {
            margin: theme.spacing(1),
            minWidth: "auto"
        }
    }
}))


export default function CheckInsPage() {
    const classes = useStyles();
    const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down("sm"));

    //Data
    const [data, setData] = useState<CheckInDTO[]>([]);

    // Table selected data
    const [selectedData, setSelectedData] = useState<CheckInDTO[]>([]);

    //Dialog
    const [open, setOpen] = useState(false);
    return (
        <React.Fragment>
            <PageContainer>
                <Grid container direction="column" spacing={2} justifyContent="center" alignItems="stretch">
                    <Grid item xs={12}>
                        <Typography variant="h4">CheckIns</Typography>
                    </Grid>
                    <Grid xs={12} item direction={!isMobile ? "row" : "column-reverse" } container spacing={2} justifyContent="center" alignItems="stretch">
                        <Grid item xs={12} md={8} >
                            <CheckInTable observe={[open]} newEntry={() => setOpen(true)} onData={setData} onSelect={setSelectedData} />
                        </Grid>
                        <Grid item xs={12} md={4} >
                            <CheckInMap data={selectedData.length > 0 ? selectedData : data} />
                        </Grid>
                    </Grid>
                </Grid>
                <CheckInEntryDialog title="Add a new CheckIn" onClose={() => setOpen(false)} open={open} />
            </PageContainer>
        </React.Fragment >
    )
}