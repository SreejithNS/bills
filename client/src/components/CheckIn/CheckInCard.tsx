import { Box, Chip, createStyles, makeStyles, Paper, PaperProps, Theme, Typography, useTheme } from '@material-ui/core';
import React from 'react';
import { CheckInDTO } from '../../types/CheckIn';
import moment from "moment";

const useStyles = makeStyles((theme: Theme) => createStyles({
    root: {
        padding: theme.spacing(2),
        display: "flex",
    },
    timestamp: {
        fontSize: theme.typography.h6.fontSize,
        color: theme.palette.text.secondary,
    },
    noteText: {
        fontSize: theme.typography.caption.fontSize,
        overflow: "hidden",
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
    }
}));



export default function CheckInCard({ data, ...rest }: {
    data: Partial<CheckInDTO>,
} & PaperProps) {

    const classes = useStyles();
    const theme = useTheme();

    const DataNotNull = (data: any, children: any) => data ? <>{children}</> : null;
    return (<>
        <Paper {...rest} className={classes.root} elevation={2}>
            <Typography variant="h2">
                {data.contact?.name ?? ""}
                <span className={classes.timestamp}> - {moment(data.createdAt).fromNow()}</span>
            </Typography>
            <Box display="flex" justifyContent="flex-start" alignItems="center" marginTop={theme.spacing(2)}>
                <DataNotNull data={data.billAmount}>
                    <Chip label={data.billAmount?.toLocaleString()} />
                </DataNotNull>
                <DataNotNull data={data.note}>
                    <span className={classes.noteText}>
                        {data.note}
                    </span>
                </DataNotNull>
                <DataNotNull data={data.dates}>
                    {
                        data.dates?.map((date, index) =>
                            <Chip key={date.name} label={date.label + " " + moment(date.value).format("DD/MM/YYYY")} />
                        )
                    }
                </DataNotNull>
            </Box>
        </Paper>
    </>)
}