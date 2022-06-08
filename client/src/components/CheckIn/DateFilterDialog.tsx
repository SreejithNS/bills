import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@material-ui/core";
import { KeyboardDatePicker, KeyboardDateTimePicker } from "@material-ui/pickers";
import { Moment } from "moment";
import React from "react";

export type DateFilter<T = any> = {
    column: string;
    operator: "==" | "<" | ">" | "<=" | ">=" | "!=";
    value: T;
};

export function DateFilterDialog(props: {
    open: boolean;
    onClose: () => void;
    onApply: (filter: DateFilter[]) => void;
    field: string;
}) {
    const [start, setStart] = React.useState<Moment>();
    const [end, setEnd] = React.useState<Moment>();

    const handleApply = React.useCallback(() => {
        let filter: DateFilter[] = [];
        if (start) {
            filter.push(
                {
                    column: props.field,
                    operator: ">=",
                    value: start?.toISOString() ?? "",
                })
        }
        if (end) {
            filter.push(
                {
                    column: props.field,
                    operator: "<=",
                    value: end?.toISOString() ?? "",
                }
            );
        }
        props.onApply(filter);
        props.onClose();
        return true;
    }, [start, end, props]);

    React.useEffect(() => {
        return () => {
            setStart(undefined);
            setEnd(undefined);
            props.onClose();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <Dialog open={props.open} onClose={props.onClose}>
            <form onSubmit={(e) => { e.preventDefault(); return handleApply() }}>
                <DialogTitle>Date Filter</DialogTitle>
                <DialogContent>
                    <KeyboardDatePicker
                        autoOk
                        name="start"
                        inputVariant="outlined"
                        size="small"
                        label="Starting Date"
                        format="DD/MM/yyyy"
                        disableFuture
                        InputAdornmentProps={{ position: "start" }}
                        value={start}
                        onChange={(date) => setStart(date?.startOf('day'))}
                    />
                    <KeyboardDateTimePicker
                        autoOk
                        name="end"
                        inputVariant="outlined"
                        size="small"
                        label="Ending Date"
                        disableFuture
                        minDate={start}
                        InputAdornmentProps={{ position: "start" }}
                        value={end}
                        onChange={(date) => setEnd(date ?? undefined)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={props.onClose}>Cancel</Button>
                    <Button type="submit" onClick={handleApply}>Apply</Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}