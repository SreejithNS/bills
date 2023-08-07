import React, { useState } from "react";
import { Select, MenuItem, TextField, IconButton, makeStyles, Theme, Paper, Box, Chip, ChipProps } from "@material-ui/core";
import Close from '@material-ui/icons/Close';
import DateRangeRounded from '@material-ui/icons/DateRangeRounded';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import { debounce } from "@material-ui/core";
import clsx from "clsx";
import { useMorph } from "react-morph";

const useStyles = makeStyles((theme: Theme) => ({
    root: {
        padding: theme.spacing(2),
    },
    searchContainer: {
        "&>*": {
            marginLeft: theme.spacing(1),
            marginRight: theme.spacing(1)
        }
    },
    chipsContainer: {
        margin: theme.spacing(1),
        marginTop: theme.spacing(2),
        overflowX: "auto",
        overflowY: "hidden",
        whiteSpace: "nowrap",
        boxShadow: `inset -42px 0px 42px -42px ${theme.palette.background.default}`,
        "&>*": {
            marginRight: theme.spacing(1)
        },
        "&::-webkit-scrollbar": {
            display: "none"
        }
    },
    scrollbox: {
        "backgroundImage": " \n    linear-gradient(to right, white, white),\n    linear-gradient(to right, white, white),\n  \n \n    linear-gradient(to right, rgba(0,0,0,.25), rgba(255,255,255,0)),\n    linear-gradient(to left, rgba(0,0,0,.25), rgba(255,255,255,0))", "backgroundPosition": "left center, right center, left center, right center", "backgroundRepeat": "no-repeat", "backgroundColor": "white", "backgroundSize": "20px 100%, 20px 100%, 10px 100%, 10px 100%", "backgroundAttachment": "local, local, scroll, scroll"
    }
}))

export interface Field<ValueType = any, FieldName = string> {
    name: FieldName;
    index: number | number[];
    label: string;
    value: ValueType | ValueType[];
    type: "string" | "boolean" | "number" | "date";
    multiple?: boolean;
    defaultValue?: ValueType;
    textField?: typeof TextField;
    searchable?: boolean;
    icon?: ChipProps["icon"];
    noChip?: boolean;
    onChange: (newValue?: ValueType) => void;
}

interface QueryFilterUIProp {
    fields: Field[];
    loading?: boolean;
    searchControlDense?: boolean;
    stopLoading?: () => void;
    openDialog: (index: number) => void;
}

export default function QueryFilterUI({ fields, searchControlDense = false, openDialog, loading = false, stopLoading = () => void (0) }: QueryFilterUIProp) {
    const classes = useStyles();
    const morph = useMorph();
    const searchableFields = fields.filter(field => field.searchable);
    const [searchField, setSearchField] = useState<typeof fields[number] | null>(searchableFields[0] ?? null);

    const chipGenerator = (field: Field, key?: number) => {
        let props: ChipProps = field.index >= 0
            ? { variant: "default", color: "primary" }
            : { variant: "outlined", color: "default" };

        if (field.icon)
            props.icon = field.icon;
        else if (field.type === "date")
            props.icon = <DateRangeRounded />;
        if (field.multiple && key !== undefined) {
            props.deleteIcon = <ArrowDropDownIcon />;
            props.onDelete = () => openDialog(key);
        }

        props.onClick = () => field.onChange(field.value);
        props.label = field.label;
        props.key = Math.random().toString();

        return <Chip component="span" {...morph} disabled={loading} {...props} />
    }

    const sortChips = (a: Field, b: Field) => {

        const calculateRank = (index: number | number[]) => {
            if (Array.isArray(index))
                return index.map(Math.log1p).reduce((acc, cur) => acc + cur, 0);
            else
                return Math.log1p(index);
        }

        return Math.abs(calculateRank(a.index)) + calculateRank(b.index);
    }

    return (
        <Paper className={classes.root} variant="outlined">
            {searchField &&
                <Box className={classes.searchContainer} display="flex" flexDirection="row" justifyContent="space-between">
                    <Select disableUnderline={searchControlDense} variant={searchControlDense ? "standard" : "outlined"} disabled={loading} value={searchField.name} onChange={(e) => setSearchField(searchableFields.find(field => field.name === (e.target.value as string)) ?? null)}>
                        {searchableFields.map(field =>
                            <MenuItem key={field.name} value={field.name}>{field.label}</MenuItem>)
                        }
                    </Select>

                    <Box flexGrow={1}>
                        {searchField.textField
                            ? <searchField.textField fullWidth={true} />
                            : <TextField
                                margin={searchControlDense ? "dense" : "none"}
                                fullWidth={true}
                                variant="outlined"
                                type="search"
                                value={searchField.value}
                                onChange={
                                    e => {
                                        const value = e.target.value as string;
                                        setSearchField(({ ...searchField, value }));
                                        debounce(() => searchField.onChange(value), 1000);
                                    }
                                }
                            />
                        }
                    </Box>
                    <Box display={"flex"} alignItems={"center"} justifyContent={"flex-end"}>
                        <IconButton disabled={!loading} onClick={stopLoading}>
                            <Close />
                        </IconButton>
                    </Box>
                </Box>
            }
            {fields.length > 0 &&
                <Box component="div" className={clsx(classes.chipsContainer, classes.scrollbox)}>
                    {
                        [...fields].sort(sortChips).filter(meta => !meta.noChip).map(chipGenerator)
                    }
                </Box>
            }
        </Paper>
    )
}