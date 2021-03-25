import * as React from "react";
import {
    Fab,
    Grid,
    Theme,
    Typography,
    makeStyles
} from "@material-ui/core";
import AddIcon from "@material-ui/icons/Add";
import ParagraphIconCard from "../components/ParagraphIconCard";
import AccountCircleRoundedIcon from "@material-ui/icons/AccountCircleRounded";
import SalesmenList from "../components/SalesmenList";
import { useHistory } from "react-router-dom";
import { accountPaths, paths } from "../routes/paths.enum";
import { useDispatch, useSelector } from "react-redux";
import UpdateSalesmanPasswordDialog from "../components/UpdateSalesmanPasswordDialog";
import PageContainer from "../components/PageContainer";
import { useEffect, useState } from "react";
import { RootState } from "../reducers/rootReducer";
import { toast } from "react-toastify";
import useAxios from "axios-hooks";
import { useHasPermission, useUsersUnderAdmin } from "../actions/auth.actions";

const useStyles = makeStyles((theme: Theme) => ({
    fab: {
        position: "fixed",
        right: theme.spacing(2),
        bottom:
            parseInt(theme.mixins.toolbar.minHeight + "", 0) + theme.spacing(2),
        transition: theme.transitions.easing.easeIn
    },
    fabIcon: {
        marginRight: theme.spacing(1)
    },
    cardPadding: {
        padding: theme.spacing(1),
        "&:last-of-type": {
            marginBottom:
                parseInt(theme.mixins.toolbar.minHeight + "", 0) + theme.spacing(8)
        }
    }
}));

export default function AccountPage() {
    const [dialogStatus, setDialogStatus] = useState<{ salesmanId: string; open: boolean }>({ salesmanId: "", open: false });
    const { userData, usersUnderUser } = useSelector((state: RootState) => state.auth);
    const { loading } = useUsersUnderAdmin();
    const classes = useStyles();
    const hasAdminPermissions = useHasPermission(undefined, !loading);
    const history = useHistory();

    return (
        <React.Fragment>
            <PageContainer>
                <Grid container justify="center" alignItems="flex-start" spacing={2}>
                    <Grid item xs={12}>
                        <Typography variant="h4">Your Account</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} className={classes.cardPadding}>
                        <ParagraphIconCard
                            icon={<AccountCircleRoundedIcon fontSize="large" />}
                            heading={"Hi " + userData?.name}
                            content={userData?.belongsTo && "You work under " + userData?.belongsTo?.name}
                        />
                    </Grid>
                    <Grid item xs={12} className={classes.cardPadding}>
                        {(!(loading) && usersUnderUser?.length) ? usersUnderUser.map(
                            (salesman, key) => (
                                <SalesmenList
                                    key={key}
                                    firstName={salesman.name}
                                    phoneNumber={salesman.phone}
                                    onEdit={() => setDialogStatus({ salesmanId: salesman._id, open: true })}
                                />
                            )
                        ) : ""}
                    </Grid>
                </Grid>
                {userData?.type === 1 &&
                    <UpdateSalesmanPasswordDialog
                        open={dialogStatus.open}
                        salesmanId={dialogStatus.salesmanId}
                        handleClose={() => setDialogStatus({ salesmanId: "", open: false })}
                    />
                }
            </PageContainer>
            {hasAdminPermissions &&
                <Fab
                    onClick={() => history.push(paths.account + accountPaths.addSalesman)}
                    className={classes.fab}
                    color="primary"
                    variant="extended"
                >
                    <AddIcon className={classes.fabIcon} /> Add Salesman
                </Fab>
            }
        </React.Fragment>
    )
}