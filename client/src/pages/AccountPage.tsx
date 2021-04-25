import * as React from "react";
import {
    Fab,
    Grid,
    Theme,
    Typography,
    makeStyles,
    Button
} from "@material-ui/core";
import AddIcon from "@material-ui/icons/Add";
import ParagraphIconCard from "../components/ParagraphIconCard";
import AccountCircleRoundedIcon from "@material-ui/icons/AccountCircleRounded";
import SalesmenList from "../components/SalesmenList";
import { useHistory } from "react-router-dom";
import { accountPaths, paths } from "../routes/paths.enum";
import { useSelector } from "react-redux";
import PageContainer from "../components/PageContainer";
import { RootState } from "../reducers/rootReducer";
import { useHasPermission, useUsersUnderAdmin } from "../actions/auth.actions";
import { UserTypes } from "../reducers/auth.reducer";
import PowerSettingsNewIcon from '@material-ui/icons/PowerSettingsNew';
import useAxios from "axios-hooks";
import { handleAxiosError } from "../components/Axios";
import { useEffect } from "react";

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
    const { userData, usersUnderUser } = useSelector((state: RootState) => state.auth);
    const { loading: usersListLoading } = useUsersUnderAdmin();
    const classes = useStyles();

    const hasAdminPermissions = useHasPermission(undefined, !usersListLoading);
    const history = useHistory();

    const [{ loading: logoutLoading, error: logoutError, data: logoutResponse }, logout] = useAxios({
        url: "/auth/logout", method: "POST"
    }, { manual: true });

    useEffect(() => {
        if (logoutResponse) {
            window.location.href = process.env.REACT_APP_API_URL + '/login';
        }
        if (logoutError) handleAxiosError(logoutError);
    }, [logoutResponse, logoutError])

    const taglineUnderUsername = () => {
        const texts = [];

        switch (userData?.type) {
            case UserTypes.admin:
                texts.push("You are an Administrator");
                break;
            case UserTypes.root:
                texts.push("You are Root User");
                break;
            case UserTypes.salesman:
                texts.push("You are a Salesman");
                break;
        }

        if (userData?.belongsTo?.name) {
            texts.push("You work under " + userData.belongsTo.name);
        }

        return texts.join(" | ");
    }
    const loading = usersListLoading || logoutLoading;
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
                            content={<>
                                {taglineUnderUsername()}<br />
                                <Button disabled={logoutLoading} color="secondary" onClick={() => logout()}>
                                    <PowerSettingsNewIcon /> Logout
                                </Button>
                            </>}
                        />
                    </Grid>
                    <Grid item xs={12} className={classes.cardPadding}>
                        {(!(loading) && usersUnderUser && usersUnderUser?.length > 0) && usersUnderUser.map(
                            (salesman, key) => (
                                <SalesmenList
                                    key={key}
                                    firstName={salesman.name}
                                    phoneNumber={salesman.phone}
                                    onEdit={() => history.push((paths.account + accountPaths.editSalesman).replace(":id", salesman._id))}
                                />
                            )
                        )}
                    </Grid>
                </Grid>
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