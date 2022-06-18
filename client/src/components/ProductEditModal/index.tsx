import React, { useEffect, useState } from 'react';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import CloseIcon from '@material-ui/icons/Close';
import Slide from '@material-ui/core/Slide';
import { TransitionProps } from '@material-ui/core/transitions';
import { CircularProgress, Container } from '@material-ui/core';
import { useHistory, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../reducers/rootReducer';
import useAxios from 'axios-hooks';
import { APIResponse, handleAxiosError } from '../Axios';
import { Product } from '../../reducers/product.reducer';
import ProductEditForm from './ProductEditForm';
import { paths } from '../../routes/paths.enum';

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        appBar: {
            position: 'relative',
        },
        title: {
            marginLeft: theme.spacing(2),
            flex: 1,
        },
        containerPadding: {
            padding: theme.spacing(2)
        }
    }),
);

const Transition = React.forwardRef(function Transition(
    props: TransitionProps & { children?: React.ReactElement },
    ref: React.Ref<unknown>,
) {
    return <Slide direction="up" ref={ref} {...props} />;
});

export default function ProductEditModal(props: { onCreate?: () => void; visible?: boolean; onClose?: any; }) {
    const [open, setOpen] = useState(true);
    const classes = useStyles();
    const history = useHistory();
    const { productId } = useParams<{ productId: string }>();
    const productCategory = useSelector((state: RootState) => state.product.productCategory);
    const [{ loading, error, data }, postData] = useAxios<APIResponse<any>>({ url: "/product", method: "POST" }, { manual: true });

    const handleSubmit = (values: any) => {
        return postData({ url: `/product/${productCategory?._id}/${productId}`, method: "PUT", data: values })
    }

    if (error) handleAxiosError(error);

    const [{ loading: dataLoading, error: dataLoadError, data: initialData }] = useAxios<APIResponse<Product>>({ url: `/product/${productCategory?._id}.${productId}`, method: "GET" }, { useCache: false })

    useEffect(() => {
        if (data) {
            if (props.onCreate) props.onCreate()
            else history.goBack()
        }
        if (error) {
            handleAxiosError(error)
        }
        if (dataLoadError) {
            handleAxiosError(dataLoadError)
        }
        //eslint-disable-next-line
    }, [data, error, dataLoadError])

    return (
        <Dialog fullScreen open={props.visible ?? open} onClose={props.onClose ?? (() => { setOpen(false); history.goBack() })} TransitionComponent={Transition}>
            <AppBar className={classes.appBar}>
                <Toolbar>
                    <IconButton edge="start" color="inherit" onClick={props.onClose ?? (() => { setOpen(false); history.goBack() })} aria-label="close">
                        <CloseIcon />
                    </IconButton>
                    <Typography variant="h6" className={classes.title}>
                        Edit Product Details
                    </Typography>
                    <Button  color="inherit" onClick={props.onClose ?? (() => { setOpen(false); history.goBack() })}>
                        Cancel
                    </Button>
                </Toolbar>
            </AppBar>
            <Container fixed className={classes.containerPadding}>
                {dataLoading
                    ? <CircularProgress />
                    : dataLoadError ? <>{history.push(paths.items)}</>
                        : <ProductEditForm onSubmit={handleSubmit} submiting={loading} category={productCategory} initialValues={initialData?.data} />
                }
            </Container>
        </Dialog>
    );
}
