import React, { useEffect, useRef, useState } from 'react'
import { Fab, Grid, Theme, Typography, List, ListItem, ListItemText, Paper, FormControl, InputLabel, MenuItem, Select, makeStyles, Button, Tooltip } from '@material-ui/core';
import { useSelector } from 'react-redux';
import AddIcon from '@material-ui/icons/Add';
import { useHistory } from 'react-router-dom';
import { itemPaths, paths } from '../routes/paths.enum';
import MaterialTable, { Query, QueryResult } from 'material-table';
import { tableIcons } from '../components/MaterialTableIcons';
import { exportToCsv, itemsArrayToCsvArray } from '../actions/item.actions';
import { toast } from 'react-toastify';
import { Add, DeleteOutlineRounded, LineStyleTwoTone, Refresh } from '@material-ui/icons';
import PageContainer from '../components/PageContainer';
import LineStyleIcon from '@material-ui/icons/LineStyle';
import EditRoundedIcon from '@material-ui/icons/EditRounded';
import { RootState } from '../reducers/rootReducer';
import ImportModal from '../components/ImportModal';
import SystemUpdateAltIcon from '@material-ui/icons/SystemUpdateAlt';
import { APIResponse, axios, handleAxiosError, interpretMTQuery } from '../components/Axios';
import { Product } from '../reducers/product.reducer';
import { PaginateResult } from '../reducers/bill.reducer';
import { useConfirm } from 'material-ui-confirm';
import NewProductCategoryModal from '../components/NewProductCategoryModal';
import { useHasPermission, useProductCategoryActions } from '../actions/auth.actions';
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

export const ProductCategorySelection = React.forwardRef<HTMLDivElement>((_, ref) => {
    const { productCategoryList, productCategory } = useSelector((state: RootState) => state.product);
    const { loading, changeCategory, error } = useProductCategoryActions();

    return (
        <FormControl variant="outlined" ref={ref}>
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
});

const ItemToolbar = () => {
    const [importModalOpen, toggleImportModal] = useState<boolean>(false);
    const [productCategoryCreationModalOpen, setProductCategoryCreationModalOpen] = useState(false);
    const { productCategory, productCategoryList } = useSelector((state: RootState) => state.product);
    const { fetchCategories } = useProductCategoryActions();
    const confirm = useConfirm();
    const history = useHistory();

    const productCategoryDeletePermission = useHasPermission(UserPermissions.ALLOW_PRODUCTCATEGORY_DELETE);
    const productCategoryCreatePermission = useHasPermission(UserPermissions.ALLOW_PRODUCTCATEGORY_POST);
    const productCreatePermission = useHasPermission(UserPermissions.ALLOW_PRODUCT_POST);
    const productCategoryEditPermission = useHasPermission(UserPermissions.ALLOW_PRODUCTCATEGORY_PUT);

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
    const handleProductCategoryEdit = () => {
        history.push((paths.items + itemPaths.editCategory).replace(":productCategoryId", productCategory?._id ?? ""))
    }
    const classes = useStyles();
    return (
        <Paper elevation={2} className={classes.cardPadding + " " + classes.flexContainer}>
            <Tooltip title="Selected Category" arrow>
                <ProductCategorySelection />
            </Tooltip>
            {productCategoryCreatePermission && <Tooltip title="Add Product Category" arrow>
                <Button
                    startIcon={<AddIcon />}
                    onClick={() => setProductCategoryCreationModalOpen(!productCategoryCreationModalOpen)}
                >Create</Button>
            </Tooltip>
            }
            {productCategoryEditPermission
                && <Tooltip title="Edit this Category" arrow>
                    <Button
                        startIcon={<EditRoundedIcon />}
                        onClick={handleProductCategoryEdit}>
                        Edit</Button>
                </Tooltip>
            }
            {(productCategoryList.length > 1 && productCategoryDeletePermission)
                && <Tooltip title="Delete this Category" arrow>
                    <Button
                        startIcon={<DeleteOutlineRounded />}
                        color="secondary"
                        onClick={handleProductCategoryDelete}>
                        Delete</Button>
                </Tooltip>
            }
            {productCreatePermission &&
                <Tooltip title={(
                    <>
                        <strong>Import from CSV</strong><br />
                        Add Multiple products to this category from Structured CSV File
                    </>
                )} arrow>
                    <Button
                        startIcon={<SystemUpdateAltIcon />}
                        onClick={() => toggleImportModal(!importModalOpen)}
                    >Import Products</Button>
                </Tooltip>
            }
            <ImportModal visible={importModalOpen} onClose={() => toggleImportModal(false)} />
            <NewProductCategoryModal visible={productCategoryCreationModalOpen} onClose={() => setProductCategoryCreationModalOpen(false)} />
        </Paper>
    )
}

export default function ItemsHomePage() {
    const classes = useStyles();
    const history = useHistory();
    const tableRef = useRef<any>(null);
    const { productCategory } = useSelector((state: RootState) => state.product);

    const confirm = useConfirm();
    const productCreatePermission = useHasPermission(UserPermissions.ALLOW_PRODUCT_POST);
    const productEditPermission = useHasPermission(UserPermissions.ALLOW_PRODUCT_PUT);
    const productDeletePermission = useHasPermission(UserPermissions.ALLOW_PRODUCT_DELETE);

    useEffect(() => {
        tableRef?.current?.onQueryChange()
    }, [productCategory])

    const fetchItems = (query: Query<Product>): Promise<QueryResult<Product>> => new Promise((resolve) => {
        const url = `/product/${productCategory?._id}/query?`;
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
                        <MaterialTable
                            tableRef={tableRef}
                            icons={tableIcons}
                            columns={[
                                { title: "Item Name", field: "name", editable: "never" },
                                { title: "Code", field: "code", editable: "never" },
                                { title: "Rate", field: "rate", type: "numeric", editable: "never" },
                                { title: "MRP", field: "mrp", type: "numeric", editable: "never" },
                            ]}
                            data={fetchItems}
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
                                    tooltip: 'Add Product',
                                    isFreeAction: true,
                                    onClick: () => history.push(paths.items + itemPaths.addItem)
                                },
                                {
                                    icon: () => <EditRoundedIcon />,
                                    tooltip: 'Edit Product',
                                    disabled: !productEditPermission,
                                    isFreeAction: false,
                                    onClick: (_, data) => {
                                        data = data as (Product);
                                        history.push((paths.items + itemPaths.editProduct).replace(":productId", data._id))
                                    }
                                },
                                {
                                    icon: () => <DeleteOutlineRounded />,
                                    disabled: !productDeletePermission,
                                    tooltip: 'Delete Product',
                                    isFreeAction: false,
                                    onClick: (_, data: any) => {
                                        confirm({
                                            title: "Are you sure?",
                                            description: "Do you really want to delete this Product?",
                                            cancellationText: "No",
                                            confirmationText: "Yes"
                                        })
                                            .then(
                                                () => axios.delete(`/product/${productCategory?._id}.${data._id}`)
                                                , () => toast.warn("Didn't delete the Product"))
                                            .then(() => tableRef?.current?.onQueryChange())
                                            .catch(handleAxiosError)
                                    }
                                }
                            ]}
                            options={{
                                exportButton: false,
                                exportCsv: (columns, data) => {
                                    exportToCsv(productCategory?.name ?? "", itemsArrayToCsvArray(data))
                                },
                                toolbarButtonAlignment: "left",
                                showTitle: false
                            }}
                            detailPanel={[{
                                icon: LineStyleIcon,
                                openIcon: LineStyleTwoTone,
                                tooltip: 'Show Units',
                                render: (rowData: Product) => {
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
