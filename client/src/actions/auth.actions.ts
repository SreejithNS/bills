import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { APIResponse } from '../components/Axios';
import { UserPermissions, UserTypes } from '../reducers/auth.reducer';
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

    const [{ loading, error, data }, fetchCategories] = useAxios<APIResponse<ProductCategory[]>>("/product/category", { manual: true });
    const dispatch = useDispatch();

    if (error) {
        toast.error("Could'nt load product categories");
    }

    const changeCategory = (payload: ProductCategory | undefined) => dispatch({ type: "SET_ITEM_CATEGORY", payload: payload ?? null });

    useEffect(() => {
        if (data) {
            dispatch({ type: "SET_ITEM_CATEGORY_LIST", payload: data.data ?? [] });
            if (data.data) {
                if (!productCategory || data.data.findIndex(category => category._id === productCategory?._id) < 0) {
                    dispatch({ type: "SET_ITEM_CATEGORY", payload: data.data[0] });
                } else {
                    dispatch({ type: "SET_ITEM_CATEGORY", payload: productCategory });
                }
            }
        } else if (productCategoryList.length <= 0) {
            fetchCategories();
        }
    }, [data, dispatch]);

    return { fetchCategories, changeCategory, loading, error };
}
