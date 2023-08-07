import AlbumRounded from '@material-ui/icons/AlbumRounded';
import React, { useCallback, useContext } from "react";
import QueryFilterUI, { Field } from "../components/QueryFilterUI";
import { QueryParamsContext, /*useQueryParams*/ } from "../components/QueryFilterUI/useQueryParams";

interface useFieldProps<T> {
    fieldMeta: Omit<T, "index" | "onChange">;
    index?: number | number[];
    onAdd: (meta: useFieldProps<T>["fieldMeta"]) => number | number[];
    onRemove: (index: number | number[]) => number | number[];
}

const useField = function <T extends Field>({ index = -1, onAdd, onRemove, fieldMeta }: useFieldProps<T>): Field {
    const onChange = useCallback((_?: T) => {
        if (index === -1) {
            onAdd(fieldMeta);
        } else {
            onRemove(index);
        }
    }, [index, onAdd, fieldMeta, onRemove]);

    return {
        index,
        ...fieldMeta,
        onChange
    };
}


export default function QueryFilter() {
    type FieldNames = "createdAt" | "updatedAt";
    const { filters: { addGreaterThanFilter, removeFilter, appliedFilters }, sort: { addSort, removeSort, appliedSorts } } = useContext(QueryParamsContext as any) as any;
    const today = useField<Field<Date, FieldNames>>(
        {
            index: appliedFilters.findIndex((f: { field: string; operator: string; value: string; }) => f.field === "createdAt" && f.operator === ">" && f.value === new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
            onAdd: ({ name, value }) => {
                removeFilter(appliedFilters.findIndex((f: { field: string; }) => f.field === "updatedAt"));
                if (Array.isArray(value))
                    return value.map(v => addGreaterThanFilter(name, v));
                else
                    return addGreaterThanFilter(name, value);
            },
            onRemove: (index) => removeFilter(index),
            fieldMeta: {
                name: appliedFilters.findIndex((f: { field: string; }) => f.field === "updatedAt") === -1 ? "createdAt" : "updatedAt",
                label: "Today",
                type: "date",
                searchable: true,
                value: new Date(new Date().setHours(0, 0, 0, 0))
            }
        });
    const yesterday = useField<Field<Date, FieldNames>>(
        {
            index: appliedFilters.findIndex((f: { field: string; operator: string; value: string; }) => f.field === "createdAt" && f.operator === ">" && f.value === new Date(new Date().setHours(0, 0, 0, 0) - 24 * 60 * 60 * 1000).toISOString()),
            onAdd: ({ name, value }) => {
                removeFilter(appliedFilters.findIndex((f: { field: string; }) => f.field === "updatedAt"));
                if (Array.isArray(value))
                    return value.map(v => addGreaterThanFilter(name, v));
                else
                    return addGreaterThanFilter(name, value);
            },
            onRemove: (index) => removeFilter(index),
            fieldMeta: {
                name: appliedFilters.findIndex((f: { field: string; }) => f.field === "updatedAt") === -1 ? "createdAt" : "updatedAt",
                label: "Yesterday",
                type: "date",
                searchable: true,
                value: [new Date(new Date().setHours(0, 0, 0, 0) - 24 * 60 * 60 * 1000), new Date(new Date().setHours(0, 0, 0, 0))]
            }
        });
    const paymentUpdates = useField<Field<Date>>(
        {
            index: appliedSorts.findIndex((f: { field: string; direction: string; }) => f.field === "updatedAt" && f.direction === "desc"),
            onAdd: () => addSort("updatedAt", "desc"),
            onRemove: (index) => removeSort(index),
            fieldMeta: {
                name: "updatedAt",
                label: "Payment Updates",
                type: "date",
                icon: <AlbumRounded />,
                searchable: true,
                value: new Date(new Date().setHours(0, 0, 0, 0) - 24 * 60 * 60 * 1000)
            }
        });

    return (
        <QueryFilterUI
            fields={[today, yesterday, paymentUpdates]}
            openDialog={(index) => console.log(index)}
        />
    )
}