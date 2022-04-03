import { PaginateResult } from '../../reducers/bill.reducer';
import { useState, useCallback, useMemo, createContext, useEffect } from "react";
import React from 'react';

interface FilterInterface<Fields extends string = string> {
    field: Fields;
    value: string | number | boolean | Date | string[] | number[];
    operator: "=" | "!=" | ">" | "<" | ">=" | "<=";
}

interface SortInterface<Fields extends string = string> {
    field: Fields;
    direction: "asc" | "desc";
}

export let QueryParamsContext = createContext({
    queryParams: {
        filter: [],
        sort: [],
        page: 1,
        pageSize: 10
    },
    setQueryParams: (queryParams: any) => { }
});


interface UseQueryParamsProps<F extends string = string> extends React.PropsWithChildren<{}> {
    initialPageSize?: number;
    initialPage?: number;
    initialFilters?: FilterInterface<F>[];
    initialSort?: SortInterface<F>[];
    fields?: F[];
    updateURL?: boolean;
    customParamNames?: {
        pageSize?: string;
        page?: string;
        sort?: string;
        fields?: string;
    };
}

export function QueryParams<Fields extends string = string>({ children, updateURL = false, initialFilters = [], initialPage = 1, initialPageSize = 10, initialSort = [], customParamNames, fields }: UseQueryParamsProps<Fields> = {}) {
    const queryParamsFromString = useCallback(
        (queryStringRaw: string) => {
            const queryString = decodeURI(queryStringRaw);
            const queryParams = queryString.substring(1).split("&").reduce((acc, curr) => {
                const match = /([a-zA-Z0-9.]+)(!=|=|<=|<|>=|>)(.+$)/g.exec(curr);
                if (match && match.length >= 4) {
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const [_, field, operator, value] = match;
                    switch (field) {
                        case "page":
                            acc.page = parseInt(value, 10);
                            break;
                        case "pageSize":
                            acc.pageSize = parseInt(value, 10);
                            break;
                        case "fields":
                            acc.fields = value.split(",") as unknown as Fields[];
                            break;
                        case "sort":
                            acc.sort = value.split(",").reduce((acc, s) => {
                                const match = /(-|)([a-zA-Z0-9.]+)/g.exec(s);
                                if (match && match.length >= 3) {
                                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                    const [_, direction, field] = match;
                                    acc.push({ field: field as unknown as Fields, direction: direction === "-" ? "desc" : "asc" });
                                }
                                return acc;
                            }, [] as SortInterface<Fields>[]);
                            break;
                        default:
                            switch (operator) {
                                case "!=":
                                case "<=":
                                case ">=":
                                case "<":
                                case ">":
                                    acc.filters.push({
                                        field: field as unknown as Fields,
                                        value,
                                        operator
                                    });
                                    break;
                                case "=":
                                    if (value.includes(",")) {
                                        acc.filters.push({
                                            field: field as unknown as Fields,
                                            value: value.split(",").map((v) => v.trim()),
                                            operator
                                        });
                                    } else {
                                        acc.filters.push({
                                            field: field as unknown as Fields,
                                            value,
                                            operator
                                        });
                                    }
                                    break;
                                default:
                                    break;
                            }
                    }
                }
                return acc;
            }, ({
                fields: fields,
                filters: [],
                page: initialPage,
                pageSize: initialPageSize,
                sort: []
            } as {
                page: number;
                pageSize: number;
                fields: Fields[];
                sort: SortInterface<Fields>[];
                filters: FilterInterface<Fields>[];
            }));
            return queryParams;
        },
        [initialPage, initialPageSize, fields],
    );
    const parsedQueryString = useMemo(() => queryParamsFromString(window.location.search), [queryParamsFromString]);
    const [page, setPage] = useState(parsedQueryString.page);
    const [pageSize, setPageSize] = useState(parsedQueryString.pageSize);
    const [sort, setSort] = useState<SortInterface<Fields>[]>(parsedQueryString.sort);
    const [filters, setFilters] = useState<FilterInterface<Fields>[]>(parsedQueryString.filters);

    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    const nextPage = useCallback(
        () => {
            if (totalPages > page) {
                setPage(page + 1);
            } else {
                setPage(1);
            }
        },
        [totalPages, page],
    );

    const prevPage = useCallback(
        () => {
            if (page > 1) {
                setPage(page - 1);
            } else {
                setPage(totalPages);
            }
        }
        , [totalPages, page]
    );

    const normaliseFilterValue = useCallback((value: string | number | boolean | Date | string[] | number[]): string | number | boolean => {
        if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
            return value;
        }
        if (value instanceof Date) {
            return value.toISOString();
        }
        // if (Array.isArray(value)) {
        //     return value.map(normaliseFilterValue as any).join(",");
        // }
        return "";
    }, []);

    const addEqualityFilter = useCallback(
        (field: Fields, value: string | number | boolean | Date | string[] | number[]) => {
            setFilters([...filters, { field, value: normaliseFilterValue(value), operator: "=" }]);
            return filters.length - 1;
        }, [filters, normaliseFilterValue]
    );

    const addInEqualityFilter = useCallback(
        (field: Fields, value: string | number | boolean | Date | string[] | number[]) => {
            setFilters([...filters, { field, value: normaliseFilterValue(value), operator: "!=" }]);
            return filters.length - 1;
        }
        , [filters, normaliseFilterValue]
    );

    const addGreaterThanFilter = useCallback(
        (field: Fields, value: string | number | boolean | Date) => {
            setFilters([...filters, { field, value: normaliseFilterValue(value), operator: ">" }]);
            return filters.length - 1;
        }
        , [filters, normaliseFilterValue]
    );

    const addLessThanFilter = useCallback(
        (field: Fields, value: string | number | boolean | Date) => {
            setFilters([...filters, { field, value: normaliseFilterValue(value), operator: "<" }]);
            return filters.length - 1;
        }
        , [filters, normaliseFilterValue]
    );

    const addGreaterThanOrEqualFilter = useCallback(
        (field: Fields, value: string | number | boolean | Date) => {
            setFilters([...filters, { field, value: normaliseFilterValue(value), operator: ">=" }]);
            return filters.length - 1;
        }
        , [filters, normaliseFilterValue]
    );

    const addLessThanOrEqualFilter = useCallback(
        (field: Fields, value: string | number | boolean | Date) => {
            setFilters([...filters, { field, value: normaliseFilterValue(value), operator: "<=" }]);
            return filters.length - 1;
        }
        , [filters, normaliseFilterValue]
    );

    const removeFilter = useCallback(
        (index: Fields | number | number[]) => {
            if (typeof index === "number") {
                setFilters(filters.filter((_, i) => i !== index));
            } else if (Array.isArray(index)) {
                var newFilters = filters;
                for (var i = 0; i < index.length; i++) {
                    newFilters = newFilters.filter((_, i) => i !== index[i]);
                }
                setFilters(newFilters);
            } else {
                setFilters(filters.filter((f) => f.field !== index));
            }
            return -1;
        }
        , [filters]
    );

    const removeAllFilters = useCallback(
        () => {
            setFilters([]);
            return -1;
        }
        , []
    );

    const addSort = useCallback(
        (field: Fields, direction: "asc" | "desc") => {
            setSort([...sort, { field, direction }]);
            return sort.length - 1;
        },
        [sort]
    );

    const removeSort = useCallback(
        (index: Fields | number | number[]) => {
            if (typeof index === "number") {
                setSort(sort.filter((_, i) => i !== index));
            } else if (Array.isArray(index)) {
                var newSorts = sort;
                for (var i = 0; i < index.length; i++) {
                    newSorts = newSorts.filter((_, i) => i !== index[i]);
                }
                setSort(newSorts);
            } else {
                setSort(sort.filter((f) => f.field !== index));
            }
            return -1;
        }
        , [sort]
    );

    const removeAllSorts = useCallback(
        () => {
            setSort([]);
            return -1;
        }
        , []
    );

    const constructQueryParams = useCallback(
        () => {
            const queryParams = {
                page,
                pageSize,
                fields,
                sort,
                filters,
            };
            return queryParams;
        },
        [page, pageSize, fields, sort, filters],
    );

    const queryParamsToString = useCallback(
        () => {
            const queryParams = constructQueryParams();
            type KeysOfQueryParamsExecptFilters = Exclude<keyof typeof queryParams, "filters">;

            return "?" + Object.keys(queryParams).map((key: string) => {
                const keyName = customParamNames ? customParamNames[key as KeysOfQueryParamsExecptFilters] ?? key : key;
                if (key === "filters") {
                    if (queryParams.filters.length === 0) return void 0;
                    return encodeURI(queryParams[key].map((f) => `${f.field}${f.operator}${f.value}`).join("&"))
                } else if (key === "sort") {
                    if (queryParams.sort.length === 0) return void 0;
                    return encodeURI(`${keyName}=${queryParams[key].map((s) => `${s.direction === "desc" ? "-" : ""}${s.field}`).join(",")}`)
                } else {
                    return encodeURI(`${keyName}=${queryParams[key as KeysOfQueryParamsExecptFilters]}`)
                }
            }).join("&");
        },
        [constructQueryParams, customParamNames]
    );

    const syncMetaData = useCallback(
        <Data extends unknown>(meta: PaginateResult<Data>) => {
            setTotalPages(meta.totalPages);
            setTotalItems(meta.totalDocs);
            return meta;
        }, []);

    const resetToInitialState = useCallback(
        () => {
            setPage(initialPage);
            setSort(initialSort);
            setFilters(initialFilters);
            setPageSize(initialPageSize);
        }, [initialFilters, initialPage, initialPageSize, initialSort]
    );

    const setQueryStringWithoutPageReload = (queries: string) => {
        if (updateURL) {
            var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + queries;
            window.history.pushState({ path: newurl }, '', newurl);
        }
        return queries;
    };

    const value = {
        queryParams: setQueryStringWithoutPageReload(queryParamsToString()),
        totalItems,
        syncMetaData,
        resetToInitialState,
        page: {
            current: page,
            total: totalPages,
            pageSize,
            nextPage,
            prevPage,
            setPage,
            setPageSize
        },
        filters: {
            appliedFilters: filters,
            addEqualityFilter,
            addInEqualityFilter,
            addGreaterThanFilter,
            addLessThanFilter,
            addGreaterThanOrEqualFilter,
            addLessThanOrEqualFilter,
            removeFilter,
            removeAllFilters,
        },
        sort: {
            appliedSorts: sort,
            addSort,
            removeSort,
            removeAllSorts,
        }
    }

    // useEffect(() => {
    //     QueryParamsContext = createContext<typeof value>(value);
    //     // eslint-disable-next-line react-hooks/exhaustive-deps
    // }, []);

    // const QueryParamsProvider = QueryParamsContext.Provider as unknown as typeof value;
    // return (<QueryParamsProvider value={value}> {children} </QueryParamsProvider>);
    return (<QueryParamsContext.Provider value={value as any}> {children} </QueryParamsContext.Provider>);
}