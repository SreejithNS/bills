import * as React from "react";
import {
    Container,
    Fab,
    Grid,
    Theme,
    withStyles,
    WithStyles,
    createStyles,
    Typography
} from "@material-ui/core";
import AddIcon from "@material-ui/icons/Add";
import ParagraphIconCard from "../components/ParagraphIconCard";
import AccountCircleRoundedIcon from "@material-ui/icons/AccountCircleRounded";
import SalesmenList from "../components/SalesmenList";
import { getSalesmenList, putSalesmanPassword } from "../actions/app.actions";
import { compose } from "redux";
import { RouteComponentProps, withRouter } from "react-router-dom";
import { accountPaths, paths } from "../routes/paths.enum";
import { connect } from "react-redux";
import UpdateSalesmanPasswordDialog from "../components/UpdateSalesmanPasswordDialog";

const mapStateToProps = (state: any) => {
    return {
        salesmenListError: state.app.salesmenListError,
        salesmenList: state.app.salesmenList,
        salesmenListLoading: state.app.salesmenListLoading,
    };
};

const mapDispatchToProps = (dispatch: any) => {
    return {
        getSalesmanList: () => dispatch(getSalesmenList()),
        updateSalesmanPassword: (newData: any) => dispatch(putSalesmanPassword(newData))
    };
};

const styles = (theme: Theme) =>
    createStyles({
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
    });

type Props = ReturnType<typeof mapDispatchToProps> &
    ReturnType<typeof mapStateToProps> &
    WithStyles<typeof styles> &
    RouteComponentProps;

class AccountPage extends React.Component<Props> {
    componentDidMount() {
        this.props.getSalesmanList();
    }
    state = {
        dialogOpen: false,
        editSalesman: ""
    }
    openDialogForSalesman = (id: string) => () => {
        this.setState({ dialogOpen: true, editSalesman: id });
    }

    handlePasswordUpdate = (values: { password: string }) => {
        const withSalesman = { ...values, salesman: this.state.editSalesman };
        this.props.updateSalesmanPassword(withSalesman);
    }

    render() {
        const { classes, salesmenList, history, salesmenListLoading } = this.props;
        const { openDialogForSalesman, handlePasswordUpdate } = this;
        const { dialogOpen } = this.state;
        return (
            <React.Fragment>
                <Container fixed>
                    <Grid container justify="center" alignItems="flex-start" spacing={2}>
                        <Grid item xs={12}>
                            <Typography variant="h4">Your Account</Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} className={classes.cardPadding}>
                            <ParagraphIconCard
                                icon={<AccountCircleRoundedIcon fontSize="large" />}
                                heading="Hi, Sreejith"
                            />
                        </Grid>
                        <Grid item xs={12} className={classes.cardPadding}>
                            {(!salesmenListLoading && salesmenList.length) ? salesmenList.map(
                                (salesman: { _id: string, firstName: string, phone: number }, key: string | number | null | undefined) => (
                                    <SalesmenList
                                        key={key}
                                        firstName={salesman.firstName}
                                        phoneNumber={salesman.phone}
                                        onEdit={openDialogForSalesman(salesman._id)}
                                    />
                                )
                            ) : ""}
                        </Grid>
                    </Grid>
                    <UpdateSalesmanPasswordDialog open={dialogOpen} handleClose={() => this.setState({ dialogOpen: false })} onSubmit={handlePasswordUpdate} />
                </Container>
                <Fab
                    onClick={() => history.push(paths.account + accountPaths.addSalesman)}
                    className={classes.fab}
                    color="primary"
                    variant="extended"
                >
                    <AddIcon className={classes.fabIcon} />
          Add Salesman
        </Fab>
            </React.Fragment>
        );
    }
}

export default compose(withStyles(styles), withRouter, connect(mapStateToProps, mapDispatchToProps))(AccountPage) as React.ComponentType;
