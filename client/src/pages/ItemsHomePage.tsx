import React, { useEffect, useRef, useState } from 'react'
import { Fab, Grid, Theme, Typography, List, ListItem, ListItemText, Paper, FormControl, InputLabel, MenuItem, Select, makeStyles, Button, CircularProgress } from '@material-ui/core';
import { useDispatch, useSelector } from 'react-redux';
import AddIcon from '@material-ui/icons/Add';
import { useHistory } from 'react-router-dom';
import { itemPaths, paths } from '../routes/paths.enum';
import MaterialTable, { Query, QueryResult } from 'material-table';
import { tableIcons } from '../components/MaterialTableIcons';
import { exportToCsv, itemsArrayToCsvArray } from '../actions/item.actions';
import { toast } from 'react-toastify';
import { Add, DeleteOutlineRounded, LineStyleTwoTone, Refresh, Store } from '@material-ui/icons';
import PageContainer from '../components/PageContainer';
import LineStyleIcon from '@material-ui/icons/LineStyle';
import { RootState } from '../reducers/rootReducer';
import ImportModal from '../components/ImportModal';
import SystemUpdateAltIcon from '@material-ui/icons/SystemUpdateAlt';
import useAxios from 'axios-hooks';
import { APIResponse, axios, handleAxiosError, interpretMTQuery } from '../components/Axios';
import { Product, ProductCategory } from '../reducers/product.reducer';
import { PaginateResult } from '../reducers/bill.reducer';
import { useConfirm } from 'material-ui-confirm';
import NewProductCategoryModal from '../components/NewProductCategoryModal';
import { useHasPermission, useProductCategoryActions } from '../actions/auth.actions';
import ParagraphIconCard from '../components/ParagraphIconCard';
import { store } from '..';
import { UserPermissions } from '../reducers/auth.reducer';

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

export function ProductCategorySelection() {
    const { productCategoryList, productCategory } = useSelector((state: RootState) => state.product);
    const { loading, changeCategory, error } = useProductCategoryActions();

    return (
        <FormControl variant="outlined">
            <InputLabel id="category-selection-label">Category</InputLabel>
            <Select
                labelId="category-selection-label"
                value={productCategory?._id ?? ""}
                onChange={(changed) => changeCategory(productCategoryList.find((category => category._id === changed.target.value)))}
                label="Category"
                disabled={loading || !!error}
            >
                {productCategoryList.map(
                    (category, key: any) => <MenuItem key={key} value={category._id}>{category.name.toUpperCase()}</MenuItem>
                )}
            </Select>
        </FormControl>
    )
}

const ItemToolbar = () => {
    const [importModalOpen, toggleImportModal] = useState<boolean>(false);
    const [productCategoryCreationModalOpen, setProductCategoryCreationModalOpen] = useState(false);
    const { productCategory, productCategoryList } = useSelector((state: RootState) => state.product);
    const { fetchCategories } = useProductCategoryActions();
    const confirm = useConfirm();

    const productCategoryDeletePermission = useHasPermission(UserPermissions.ALLOW_PRODUCTCATEGORY_DELETE);
    const productCategoryCreatePermission = useHasPermission(UserPermissions.ALLOW_PRODUCTCATEGORY_POST);
    const productCreatePermission = useHasPermission(UserPermissions.ALLOW_PRODUCT_POST);

    const handleProductCategoryDelete = () => {
        confirm({
            title: "Are you sure?",
            description: "Deleting a product category will delete all the Product items within the category. Do you really want to delete this Product category?",
            cancellationText: "No",
            confirmationText: "Yes"
        }).then(() => {
            axios.delete<APIResponse<{ deletedProductsCount: number }>>(`/product/${productCategory?._id}`)
                .then(response => {
                    toast.success(`Product category along with its ${response.data.data?.deletedProductsCount} products deleted.`);
                    fetchCategories();
                }).catch(handleAxiosError);
        }, () => toast.warn("Didn't delete the product category"));
    }
    const classes = useStyles();
    return (
        <Paper elevation={2} className={classes.cardPadding + " " + classes.flexContainer}>
            <ProductCategorySelection />
            {productCategoryCreatePermission && <Button
                startIcon={<AddIcon />}
                onClick={() => setProductCategoryCreationModalOpen(!productCategoryCreationModalOpen)}
            >Create</Button>}
            {(productCategoryList.length > 1 && productCategoryDeletePermission)
                && <Button
                    startIcon={<DeleteOutlineRounded />}
                    color="secondary"
                    onClick={handleProductCategoryDelete}>
                    Delete</Button>
            }
            {productCreatePermission &&
                <Button
                    startIcon={<SystemUpdateAltIcon />}
                    onClick={() => toggleImportModal(!importModalOpen)}
                >Import Products</Button>
            }
            <ImportModal visible={importModalOpen} onClose={() => toggleImportModal(false)} />
            <NewProductCategoryModal visible={productCategoryCreationModalOpen} onClose={() => setProductCategoryCreationModalOpen(false)} />
        </Paper>
    )
}

const ItemsTable = ({ productCategoryId, productCategoryName }: { productCategoryId?: ProductCategory["_id"], productCategoryName?: ProductCategory["name"] }) => {
    const history = useHistory();
    const tableRef = useRef<any>(null);
    const productCreatePermission = useHasPermission(UserPermissions.ALLOW_PRODUCT_POST);

    if (!productCategoryId || !productCategoryName) return (
        <ParagraphIconCard
            heading="Please Select a product category"
            icon={<CircularProgress />}
        />
    )

    store.subscribe(() => {
        tableRef?.current?.onQueryChange();
    })

    const fetchItems = (query: Query<{
        units?: any[] | undefined;
    }>): Promise<QueryResult<Product>> => new Promise((resolve) => {
        const url = `/product/${productCategoryId}/query?`;
        const search = (new URLSearchParams(interpretMTQuery(query))).toString();
        axios
            .get<APIResponse<PaginateResult<Product>>>(url + search)
            .then(function ({ data: responseData }) {
                if (responseData.data)
                    resolve({
                        data: responseData.data.docs,
                        page: responseData.data.page - 1,
                        totalCount: responseData.data.totalDocs
                    });
            })
            .catch(handleAxiosError)
    })
    return (
        <MaterialTable
            tableRef={tableRef}
            icons={tableIcons}
            columns={[
                { title: "Item Name", field: "name", editable: "never" },
                { title: "Code", field: "code", editable: "never" },
                { title: "Rate", field: "rate", type: "numeric", editable: "never" },
                { title: "MRP", field: "mrp", type: "numeric", editable: "never" },
            ]}
            data={(query) => fetchItems(query)}
            actions={[
                {
                    icon: () => <Refresh />,
                    tooltip: 'Refresh Data',
                    isFreeAction: true,
                    onClick: () => tableRef?.current?.onQueryChange(),
                },
                {
                    icon: () => <Add />,
                    disabled: !productCreatePermission,
                    tooltip: 'Add Item',
                    isFreeAction: true,
                    onClick: () => history.push(paths.items + itemPaths.addItem)
                }
            ]}
            options={{
                exportButton: false,
                exportCsv: (columns, data) => {
                    exportToCsv(productCategoryName, itemsArrayToCsvArray(data))
                },
                toolbarButtonAlignment: "left",
                showTitle: false
            }}
            detailPanel={[{
                icon: LineStyleIcon,
                openIcon: LineStyleTwoTone,
                tooltip: 'Show Units',
                render: (rowData: { units?: any[] }) => {
                    return (rowData.units && rowData.units.length) ? (
                        <List dense>
                            {rowData.units.map((unit: { name: string; rate: number; mrp: number; }, key) =>
                                <ListItem key={key}>
                                    <ListItemText
                                        primary={unit.name.toUpperCase()}
                                        secondary={`MRP:₹${unit.mrp} RATE:₹${unit.rate}`}
                                    />
                                </ListItem>,
                            )}
                        </List>
                    ) : <></>
                }
            }]}
        />
    )
}

export default function ItemsHomePage() {
    const classes = useStyles();
    const history = useHistory();
    const { productCategory } = useSelector((state: RootState) => state.product);
    const productCreatePermission = useHasPermission(UserPermissions.ALLOW_PRODUCT_POST);

    return (
        <React.Fragment>
            <PageContainer>
                <Grid
                    container
                    justify="center"
                    alignItems="flex-start"
                    spacing={2}
                >
                    <Grid item xs={12}>
                        <Typography variant="h4">
                            Inventory
                            </Typography>
                    </Grid>
                    <Grid item xs={12} className={classes.cardPadding}>
                        <ItemToolbar />
                    </Grid>
                    <Grid item xs={12} className={classes.cardPadding}>
                        <ItemsTable
                            productCategoryId={productCategory?._id}
                            productCategoryName={productCategory?.name}
                        />
                    </Grid>
                </Grid>
            </PageContainer>
            {productCreatePermission && <Fab onClick={() => history.push(paths.items + itemPaths.addItem)} className={classes.fab} color="primary" variant="extended">
                <AddIcon className={classes.fabIcon} />
                        Add Item
                </Fab>}
        </React.Fragment >
    )
}
