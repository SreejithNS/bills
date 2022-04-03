import React from "react";
import {
    Card,
    Container,
    createStyles,
    Grid,
    Theme,
    Typography,
    withStyles,
    WithStyles
} from "@material-ui/core";
import LoginForm from "../components/Forms/Login";
import { APIResponse, axios, handleAxiosError } from "../components/Axios";
import { connect, ConnectedProps, MapDispatchToProps } from "react-redux";
import { toast } from "react-toastify";
import { RootState } from "../reducers/rootReducer";
import { UserData } from "../reducers/auth.reducer";
import { RouteComponentProps, withRouter } from "react-router-dom";
import { paths } from "../routes/paths.enum";
import { Redirect } from "react-router-dom";

const styles = (theme: Theme) => createStyles({
    root: {
        padding: theme.spacing(1),
        paddingTop: theme.spacing(2),
        paddingBottom: theme.spacing(2),
        display: "flex",
        alignItems: "Center",
        justifyContent: "space-around",
        flexWrap: "wrap",
        "&>*": {
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            margin: theme.spacing(1)
        }
    },
    branding: {
        margin: theme.spacing(2)
    }
});

interface Props extends WithStyles<typeof styles>, ConnectedProps<typeof connector>, RouteComponentProps {

}

class LoginPage extends React.Component<Props> {
    state = {
        loading: false,
        disabled: false
    }
    handleSubmit = ({ phone, password }: Record<"phone" | "password", string>) => {
        const { dataLoad, history } = this.props;
        this.setState({ loading: true, disabled: true });
        axios
            .post<APIResponse<UserData>>("/auth/login", { phone, password })
            .then((res) => {
                const data = res.data.data;
                if (!data) toast.error("Server did not send User Data");
                else dataLoad(data);
                history.push(paths.home);
            }).catch(handleAxiosError).finally(() => this.setState({ loading: false, disabled: false }))
    }
    render() {
        const { state: { loading, disabled }, props: { classes, authentication }, handleSubmit } = this;
        if (authentication !== null) return (<Redirect to={paths.home} />);
        return (
            <>
                <Grid
                    container
                    spacing={0}
                    alignItems="center"
                    justify="center"
                    style={{ minHeight: "100vh" }}
                >
                    <Grid item xs>
                        <Container fixed maxWidth="sm">
                            <Card className={classes.root}>
                                <div className={classes.branding}>
                                    <Typography variant="h3">Billz</Typography>
                                    <Typography variant="subtitle1">
                                        Sophisticated but simple
                                    </Typography>
                                </div>
                                <div>
                                    <LoginForm onSubmit={handleSubmit} loading={loading} disabled={disabled} />
                                </div>
                            </Card>
                        </Container>
                    </Grid>
                </Grid>
            </>
        );
    }
}
const mapState = (state: RootState) => {
    return {
        authentication: state.auth.userData
    }
}

const mapDispatch = (dispatch: (arg0: (value: any) => { type: string; payload: any; }) => any) => ({
    dataLoad: (values: UserData) => dispatch((value: any) => ({ type: "USER_DATA", payload: value })),
})

const connector = connect(mapState, mapDispatch as any);
export default connector(withRouter(withStyles(styles)(LoginPage) as any) as any)