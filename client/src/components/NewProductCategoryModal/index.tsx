import { Button, TextField, Typography } from "@material-ui/core";
import useAxios from "axios-hooks";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useProductCategoryActions } from "../../actions/auth.actions";
import { UserData } from "../../reducers/auth.reducer";
import { ProductCategory } from "../../reducers/product.reducer";
import { handleAxiosError } from "../Axios";
import Modal, { ModalProps } from "../Modal";
import UsersTransferList from "../UsersTransferList";

export default function NewProductCategoryModal(props: ModalProps) {
    const [hasAccess, setHasAccess] = useState<UserData["_id"][]>([]);
    const [name, setName] = useState<ProductCategory["name"]>("");
    const { fetchCategories } = useProductCategoryActions();
    const [{ error, loading, data }, createCategory] = useAxios({
        url: "/product/category",
        method: "POST",
        data: {
            name, ...(hasAccess && { hasAccess })
        },
    }, { manual: true })

    const dataReady = name.length > 0;
    const handleUsersListUpdate = (data: UserData[]) => {
        setHasAccess(data.map(d => d._id));
    }

    if (error) {
        handleAxiosError(error)
    }

    useEffect(() => {
        if (data) {
            toast.success("Product Category created!");
            fetchCategories();
        }
        return () => {
            props.onClose && props.onClose();
        }
    }, [data])


    return (
        <Modal visible={props.visible} onClose={props.onClose} title="Create Product Category">
            <form style={{ display: "flex", flexFlow: "column wrap", alignItems: "center" }} onSubmit={(e) => { e.preventDefault(); if (dataReady) createCategory() }}>
                <TextField
                    style={{ alignSelf: "stretch" }}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    label="Product Category Name"
                    variant="outlined"
                /><br />
                <Typography variant="caption">
                    Who has access to this set of products?
                </Typography>
                <UsersTransferList
                    onListUpdate={handleUsersListUpdate}
                />
                <Button disabled={loading || !dataReady} onClick={() => createCategory()} variant="contained" color="primary">
                    Create
                </Button>
            </form>
        </Modal >
    )
}