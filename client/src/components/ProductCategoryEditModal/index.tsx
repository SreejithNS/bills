import React, { useEffect, useState } from 'react';
import useAxios from 'axios-hooks';
import { APIResponse, handleAxiosError } from '../Axios';
import { UserData } from '../../reducers/auth.reducer';
import { toast } from 'react-toastify';
import Modal from '../Modal';
import ErrorIcon from '@material-ui/icons/Error';
import { useUsersUnderAdmin } from '../../actions/auth.actions';
import { RootState } from '../../reducers/rootReducer';
import { useSelector } from 'react-redux';
import { ProductCategory } from '../../reducers/product.reducer';
import { useParams } from 'react-router-dom';
import ParagraphIconCard from '../ParagraphIconCard';
import { Button, TextField, Typography } from '@material-ui/core';
import UsersTransferList from '../UsersTransferList';

export default function ProductCategoryEditModal() {
    const params = useParams<{ productCategoryId: ProductCategory["_id"] }>();
    const productCategory = useSelector((state: RootState) => state.product.productCategoryList.find((category) => category._id === params.productCategoryId))
    const [{ loading, error, data }, postData] = useAxios<APIResponse<UserData["_id"]>>({ url: "/product/register", method: "PUT" }, { manual: true });
    const { fetchUsersUnderAdmin } = useUsersUnderAdmin();
    const putData = (data: ProductCategory) => {
        const putData: any = { ...data };
        putData.hasAccess = data.hasAccess.map((user) => user._id);
        console.log(putData)
        return putData;
    }
    const handleSubmit = (values: ProductCategory) => {
        postData({ url: `/product/${params.productCategoryId}`, method: "PUT", data: putData(values) });
    }

    useEffect(() => {
        if (data) {
            toast.success("Product Category Edited");
            fetchUsersUnderAdmin();
        }
        if (error) handleAxiosError(error);
    }, [data, error])

    const [productCategoryData, setProductCategoryData] = useState(productCategory);

    return (productCategoryData === undefined) || (productCategory === undefined)
        ? (
            <Modal title="Add Salesman">
                <ParagraphIconCard
                    heading="Product Category not found"
                    icon={<ErrorIcon />}
                />
            </Modal>
        )
        : (
            <Modal title="Product Category Edit">
                <form style={{ display: "flex", flexFlow: "column wrap", alignItems: "center" }} onSubmit={(e) => { e.preventDefault(); if (JSON.stringify(productCategory) !== JSON.stringify(productCategoryData)) handleSubmit(productCategoryData) }}>
                    <TextField
                        style={{ alignSelf: "stretch" }}
                        value={productCategoryData.name}
                        onChange={(e) => {
                            const name = e.target.value;
                            setProductCategoryData((prevData) => {
                                const newState = { ...prevData as any }
                                newState.name = name;
                                return newState;
                            })
                        }}
                        label="Product Category Name"
                        variant="outlined"
                    /><br />
                    <Typography variant="caption">
                        Who has access to this set of products?
                    </Typography>
                    <UsersTransferList
                        value={productCategoryData.hasAccess}
                        onListUpdate={(data) => {
                            console.log(data)
                            setProductCategoryData((prevData) => {
                                const newState = { ...prevData as any }
                                newState.hasAccess = [...data];
                                return newState;
                            })
                        }}
                    />
                    <Button disabled={loading || JSON.stringify(productCategory) === JSON.stringify(productCategoryData)} onClick={() => handleSubmit(productCategoryData)} variant="contained" color="primary">
                        Save
                </Button>
                </form>
            </Modal>
        );
}
