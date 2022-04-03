import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Route, Redirect, RouteProps } from 'react-router-dom';
import { useAuthActions, useUsersUnderAdmin, useProductCategoryActions } from '../../actions/auth.actions';
import { RootState } from '../../reducers/rootReducer';
import { paths } from '../../routes/paths.enum';
import FullScreenLoading from '../FullScreenLoading';

function PrivateRoute(props: RouteProps): React.ReactElement {
    const { component: Component, ...rest } = props;
    const { initiated: init1 } = useAuthActions();
    const { initiated: init2 } = useUsersUnderAdmin();
    const { initiated: init3 } = useProductCategoryActions();
    const [init, setInit] = useState(false);

    useEffect(() => {
        if (!init && (init1 && init2 && init3)) {
            setInit(true);
        }
    }, [init1, init2, init3, init]);

    const userData = useSelector((state: RootState) => state.auth.userData);

    const render = useCallback((props: any) => {
        if (!init) return <FullScreenLoading />;

        if (userData === null) {
            return <Redirect to={paths.login} />;
        }
        if (Component) {
            return <Component {...props} />;
        } else return <FullScreenLoading />;
    }, [init, userData]);

    return <Route {...rest} render={render} />;
}

export default PrivateRoute;