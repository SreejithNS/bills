import React, { useState, useEffect } from "react";
import MaterialTable from "material-table";
import { useSelector } from "react-redux";
import { RootState } from "../../reducers/rootReducer";
import { Box, Chip, CircularProgress, Tooltip, useTheme } from "@material-ui/core";
import useAxios from "axios-hooks";
import { APIResponse, handleAxiosError } from "../Axios";
import { PaginateResult } from "../../reducers/bill.reducer";
import { CheckInDTO } from "../../types/CheckIn";
import moment from "moment";
import { SalesmanSelection } from "../BillSearch";
import { UserData, UserPermissions } from "../../reducers/auth.reducer";
import { CustomerSelection } from "../NewBillForm";
import { Customer } from "../../reducers/customer.reducer";
import FilterListIcon from '@material-ui/icons/FilterList';
import AddIcon from "@material-ui/icons/Add";
import { tableIcons } from "../MaterialTableIcons";
import { useHasPermission } from "../../actions/auth.actions";
import RefreshIcon from '@material-ui/icons/Refresh';

interface CheckInTableProps {
    /**
     * Sends the data when its loaded
     */
    onData?: (data: CheckInDTO[]) => void;
    /**
     * Sends the selected data in the table
     */
    onSelect?: (data: CheckInDTO[]) => void;
    /**
     * Trigger new entry action with a callback function
     */
    newEntry?: () => void;
    /**
     * Trigger refresh when there is change in observable data 
     */
    observe: any[];
}

export const noteHighlighter = (note: string | null, presets: string[] = []) => {
    let result: JSX.Element[] = [];
    presets.forEach(preset => {
        if (note === null) return result.push(<></>);
        let startIndex = note.indexOf(preset);
        if (startIndex !== -1) {
            return result.push(<>
                {note.substring(0, startIndex)} <Chip size="small" label={preset} />  {note.substring(startIndex + preset.length)}
            </>)
        } else {
            return result.push(<>{note}</>)
        }
    })
    return result;
}

export default function CheckInTable({ onData, onSelect, newEntry = () => void 0, observe = [] }: CheckInTableProps) {
    // Query Parameters
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(6);
    const [filterToggle, setFilterToggle] = useState(false);
    const [filter, setFilter] = useState("");
    const [sort, setSort] = useState("");
    const [salesman, setSalesman] = useState<UserData | null>(null);
    const [customer, setCustomer] = useState<Customer | null>(null);

    // Styles
    const theme = useTheme();

    //Permission To access
    const viewAllPermission = useHasPermission(UserPermissions.ALLOW_CHECKIN_GET_ALL);
    const createPermission = useHasPermission(UserPermissions.ALLOW_CHECKIN_POST);

    // Organisational Settings
    const { organistaionData, userData } = useSelector((state: RootState) => state.auth);

    // Data for the table
    const [{ loading, data, error }, refetch] = useAxios<APIResponse<PaginateResult<CheckInDTO>>>(
        {
            url: "/checkin?" + filter,
            params: {
                page: page + 1,
                limit: rowsPerPage,
                sort: sort || "-createdAt",
                checkedBy: viewAllPermission
                    ? salesman?._id.toString() ?? undefined
                    : userData?._id.toString() ?? undefined,
                contact: customer?._id.toString() ?? undefined
            }
        }, { manual: true }
    );

    // Load only when organisation data and user data are present
    useEffect(() => {
        if (organistaionData !== null || userData !== null) {
            refetch();
        }
    }, [organistaionData, refetch, userData]);

    // Export data to parent component
    useEffect(() => {
        if (onData) onData(data?.data?.docs ?? []);
    }, [onData, data]);

    // Handle parameter change
    useEffect(() => {
        refetch();
    }, [page, rowsPerPage, filter, sort, salesman, customer, refetch]);

    // Handle the error
    useEffect(() => {
        if (error) {
            handleAxiosError(error);
        }
    }, [error]);

    // Observe for table refresh
    useEffect(() => {
        refetch();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refetch, ...observe]);

    if (organistaionData === null || userData === null) {
        return <Box flexGrow={1} padding={theme.spacing(2)} margin={theme.spacing(1)}><CircularProgress /></Box>
    }

    const { customerRequired, noteRequired, notePresets, distanceThreshold } = organistaionData.checkInSettings;

    return (<MaterialTable
        icons={tableIcons}
        isLoading={loading}
        data={data?.data?.docs ?? []}
        page={page}
        onChangePage={(page, pageSize) => { setPage(page); setRowsPerPage(pageSize) }}
        totalCount={data?.data?.totalDocs ?? 0}
        //onChangePage={(_event, newPage) => setPage(newPage)}
        onChangeRowsPerPage={(newRowsPerPage) => setRowsPerPage(newRowsPerPage)}
        onQueryChange={({ orderBy, orderDirection, page, filters }) => {
            setSort(`${orderDirection === "desc" ? "-" : ""}${orderBy ?? ""}`);
            setPage(page);
            setFilter(filters.map(f => f.column + f.operator + f.value).join("&"));
        }}
        onOrderChange={(orderBy, orderDirection) => setSort(`${orderDirection === "desc" ? "-" : ""}${orderBy ?? ""}`)}
        columns={
            [
                {
                    title: "Name",
                    field: "checkedBy.name",
                    type: "string",
                    sorting: false,
                    filterComponent: () =>
                        <SalesmanSelection
                            salesman={salesman ?? undefined}
                            onChange={(s) => {
                                setSalesman(s)
                            }}
                            disabled={loading}
                            inputProps={{
                                variant: "standard",
                                label: "",
                            }}
                        />
                },
                {
                    title: "Contact",
                    field: "contact.name",
                    type: "string",
                    sorting: false,
                    hidden: !customerRequired,
                    filterComponent: () =>
                        <CustomerSelection
                            customer={customer ?? undefined}
                            onChange={(c) => {
                                setCustomer(c)
                            }}
                            addNewCustomer={() => void (0)}
                            inputProps={{
                                variant: "standard",
                                label: "",
                            }}
                        />
                },
                {
                    title: "Note",
                    field: "note",
                    type: "string",
                    sorting: false,
                    hidden: !noteRequired,
                    render: ({ note }) => noteHighlighter(note, notePresets)
                },
                {
                    title: "Distance",
                    field: "distance",
                    type: "numeric",
                    render: ({ distance }) => {
                        if (distance === null) return "";
                        if (distance > distanceThreshold) return <Chip label={distance + "m"} color="secondary" />;
                        return distance + "m";
                    },
                },
                {
                    title: "Checked At",
                    field: "createdAt",
                    type: "datetime",
                    render: ({ createdAt }) =>
                        <Tooltip title={moment(createdAt).format("DD-MM-YYYY HH:mm")}>
                            <>{moment(createdAt).fromNow()}</>
                        </Tooltip>,
                },
            ]
        }
        options={
            {
                showTitle: false,
                pageSize: rowsPerPage,
                filtering: filterToggle,
                search: false,
                filterCellStyle: {
                    padding: theme.spacing(1),
                },
                selection: true,
                toolbarButtonAlignment: "left",
                pageSizeOptions: [
                    5,
                    10,
                    data?.data?.totalDocs ?? 20,
                ],
            }
        }

        onSelectionChange={(rows: CheckInDTO[]) => {
            if (onSelect) onSelect(rows);
        }}
        actions={
            [
                {
                    icon: () => <AddIcon />,
                    tooltip: "Add Check-In",
                    disabled: !createPermission,
                    isFreeAction: true,
                    onClick: () => newEntry(),
                }
                , {
                    icon: () => <RefreshIcon />,
                    tooltip: "Refresh",
                    isFreeAction: true,
                    onClick: () => refetch(),
                }
                , {
                    icon: () => <FilterListIcon color={filterToggle ? "primary" : "disabled"} />,
                    tooltip: "Filter",
                    isFreeAction: true,
                    onClick: () => setFilterToggle(!filterToggle),
                }
            ]}

        localization={{
            toolbar: {
                nRowsSelected: "{0} CheckIn's selected"
            },
        }}
    />
    )
}