import { handleAxiosError, APIResponse } from './../components/Axios/index';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { UserData, UserPermissions, UserTypes } from '../reducers/auth.reducer';
import { ProductCategory } from '../reducers/product.reducer';
import { RootState } from '../reducers/rootReducer';
import useAxios from 'axios-hooks';

export function useHasPermission(explicitPermission?: UserPermissions, extraCondition?: boolean): boolean {
    const user = useSelector((state: RootState) => state.auth.userData)
    var flag = false;

    if (user?.type === UserTypes.admin || user?.type === UserTypes.root) {
        flag = true;
    } else if (explicitPermission && user?.settings.permissions.includes(explicitPermission)) {
        flag = true;
    }

    return (extraCondition ?? true) && flag;
}

export function useProductCategoryActions() {
    const productCategory = useSelector((state: RootState) => state.product.productCategory);
    const productCategoryList = useSelector((state: RootState) => state.product.productCategoryList);

    const [{ loading, error, data }, fetchCategories] = useAxios<APIResponse<ProductCategory[]>>({ url: "/product/category" }, { manual: true });
    const dispatch = useDispatch();

    const changeCategory = (payload: ProductCategory | undefined) => dispatch({ type: "SET_ITEM_CATEGORY", payload: payload ?? null });

    useEffect(() => {
        if (error) {
            toast.error("Could'nt load product categories");
        }
        if (data) {
            dispatch({ type: "SET_ITEM_CATEGORY_LIST", payload: data.data ?? [] });
            if (data.data) {
                if (!productCategory || data.data.findIndex(category => category._id === productCategory?._id) < 0) {
                    dispatch({ type: "SET_ITEM_CATEGORY", payload: data.data[0] });
                } else {
                    dispatch({ type: "SET_ITEM_CATEGORY", payload: productCategory });
                }
            }
        } else if (productCategoryList.length <= 0 && !error) {
            fetchCategories();
        }
    }, [data, dispatch, error]);

    return { fetchCategories, changeCategory, loading, error, initiated: !!productCategoryList };
}

export function useUsersUnderAdmin() {
    const [{ data, loading, error: fetchError }, fetchSalesmenList] = useAxios<APIResponse<UserData[]>>('/auth/salesmen', { manual: true });
    const usersUnderUser = useSelector((state: RootState) => state.auth.usersUnderUser);
    const hasAdminPermissions = useHasPermission(undefined);
    const dispatch = useDispatch();

    useEffect(() => {
        if (!hasAdminPermissions && !usersUnderUser && !fetchError) {
            fetchSalesmenList();
        }

        if (fetchError) {
            handleAxiosError(fetchError);
        }

        if (data) {
            dispatch({ type: "USERS_UNDER_USER", payload: data.data });
        }

        dispatch({ type: "USER_DATA_LOAD", payload: loading });

    }, [dispatch, data, fetchError, fetchSalesmenList, hasAdminPermissions, loading]);

    return { fetchUsersUnderAdmin: fetchSalesmenList, loading, error: fetchError, initiated: !!usersUnderUser };
}

export function useAuthActions() {
    const [{ data, loading, error }, fetchUserData] = useAxios<APIResponse<UserData>>('/auth/', { manual: true });
    const userData = useSelector((state: RootState) => state.auth.userData);
    const dispatch = useDispatch();

    useEffect(() => {
        if (data) {
            dispatch({ type: "USER_DATA", payload: data.data });
        }
        if (userData === null && !error) {
            fetchUserData()
        }
        if (error) handleAxiosError(error);
    }, [data, dispatch])

    return { fetchUserData, loading, error, initiated: !!userData };
}