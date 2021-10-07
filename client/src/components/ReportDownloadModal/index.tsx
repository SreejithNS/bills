import React, { useEffect } from 'react';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import { CloudDownloadRounded } from '@material-ui/icons';
import useAxios from 'axios-hooks';
import Modal, { ModalProps } from '../Modal';
import { handleAxiosError } from '../Axios';
import BillSearch from '../BillSearch';
import { useQueryStringKey } from 'use-route-as-state';
import fileDownload from "js-file-download";

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        dropZone: {
            height: "auto",
            //margin: theme.spacing(2)
        },
        root: {
            display: "flex",
            alignContent: "stretch",
            justifyContent: "center",
            flexFlow: "column wrap",
            "&>*": {
                margin: theme.spacing(1)
            }
        }
    }),
);

export default function ReportDownloadModal(props: ModalProps) {
    const classes = useStyles();

    const [sortParam, setSortParam] = useQueryStringKey("sortParam", "createdAt");
    const [sortDirection, setSortDirection] = useQueryStringKey("sortDirection", "desc");
    const [searchParam, setSearchParam] = useQueryStringKey("searchParam", "customer");
    const [searchValue, setSearchValue] = useQueryStringKey("searchValue");
    const [selectedFromDate, setSelectedFromDate] = useQueryStringKey("fromDate");
    const [selectedToDate, setSelectedToDate] = useQueryStringKey("toDate");
    const [creditFilter, setCreditFilter] = useQueryStringKey("credit");

    const [{ loading, error, response }, execute, cancel] = useAxios<Blob>({
        url: "/bill/asCSV",
        params: {
            page: 1,
            sort: (sortDirection === "desc" ? "-" : "") + sortParam,
            ...((searchParam && searchValue) && { [searchParam]: searchValue }),
            ...(selectedFromDate && { "startDate": selectedFromDate }),
            ...(selectedToDate && { "endDate": selectedToDate }),
            ...(creditFilter && { credit: creditFilter === "1" })
        }, responseType: 'blob'
    }, { useCache: false, manual: true });

    useEffect(() => {
        if (response && !loading) {
            debugger;
            const fileName = response.headers["x-bills-report-filename"];
            fileDownload(response.data, fileName)
        }
    }, [response, loading]);

    useEffect(() => {
        if (error) handleAxiosError(error);
    }, [error]);

    useEffect(() => () => cancel(), [cancel]);

    return (
        <Modal title="Export Bill Data as Report CSV">
            <div className={classes.root}>
                <BillSearch
                    expanded={true}
                    creditFilter={creditFilter ?? ""}
                    onCreditFilterChange={setCreditFilter}
                    selectedToDate={selectedToDate || null}
                    selectedFromDate={selectedFromDate || null}
                    onSelectedToDateChange={(value) => setSelectedToDate(value ?? "")}
                    onSelectedFromDateChange={(value) => setSelectedFromDate(value ?? "")}
                    searchParam={searchParam}
                    onSearchParamChange={setSearchParam}
                    onSearchValueChange={setSearchValue}
                    onSortDirectionChange={setSortDirection}
                    onSortParamChange={setSortParam}
                    sortDirection={(sortDirection ?? "desc") as "asc" | "desc"}
                    sortParam={sortParam ?? ""}
                />
                <Button disabled={loading} variant="contained" onClick={() => execute()} startIcon={<CloudDownloadRounded />} >Download</Button>
            </div>
        </Modal>
    );
}
