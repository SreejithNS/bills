import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import BottomNavigation from '@material-ui/core/BottomNavigation';
import BottomNavigationAction from '@material-ui/core/BottomNavigationAction';
import { CalendarViewDay, Home, Receipt, RecentActors } from '@material-ui/icons';
import { useHistory, useLocation } from 'react-router-dom';
import { paths } from '../../routes/paths.enum';
import AccountCircleRoundedIcon from "@material-ui/icons/AccountCircleRounded";
import { useHasPermission } from '../../actions/auth.actions';
import { UserPermissions } from '../../reducers/auth.reducer';

const useStyles = makeStyles({
    root: {
        position: "fixed",
        bottom: "0%",
        width: "100%",
        "@media print": {
            display: "none"
        }
    }
});

export default function AppBottomNavigation() {
    const classes = useStyles();
    const history = useHistory();
    const location = useLocation<paths>();
    const [value, setValue] = React.useState<paths>(location.pathname as unknown as paths);

    const openLink = (path: string) => () => {
        history.push(path);
    }

    const itemsPageAccess = useHasPermission(UserPermissions.ALLOW_PAGE_ITEMS);
    const homePageAccess = useHasPermission(UserPermissions.ALLOW_PAGE_HOME);
    const billsPageAccess = useHasPermission(UserPermissions.ALLOW_PAGE_BILLS);
    const customersPageAccess = useHasPermission(UserPermissions.ALLOW_PAGE_CUSTOMERS);
    const accountsPageAccess = useHasPermission(UserPermissions.ALLOW_PAGE_ACCOUNTS);

    return (
        <BottomNavigation
            value={value}
            onChange={(event, newValue) => {
                setValue(newValue)//locations.indexOf(history.location.pathname));
            }}
            className={classes.root}
        >
            {itemsPageAccess && <BottomNavigationAction onClick={openLink(paths.items)} value={paths.items} label="Inventory" icon={<CalendarViewDay />} />}
            {homePageAccess && <BottomNavigationAction onClick={openLink(paths.billsHome)} value={paths.billsHome} label="Bills" icon={<Receipt />} />}
            {billsPageAccess && <BottomNavigationAction onClick={openLink(paths.home)} value={paths.home} label="Home" icon={<Home />} />}
            {customersPageAccess && <BottomNavigationAction onClick={openLink(paths.customer)} value={paths.customer} label="Customer" icon={<RecentActors />} />}
            {accountsPageAccess && <BottomNavigationAction onClick={openLink(paths.account)} value={paths.account} label="Account" icon={<AccountCircleRoundedIcon />} />}
        </BottomNavigation>
    );
}