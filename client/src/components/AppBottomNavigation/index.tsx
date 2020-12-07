import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import BottomNavigation from '@material-ui/core/BottomNavigation';
import BottomNavigationAction from '@material-ui/core/BottomNavigationAction';
import { CalendarViewDay, Home, Receipt, RecentActors } from '@material-ui/icons';
import { useHistory } from 'react-router-dom';
import { paths } from '../../routes/paths.enum';
import AccountCircleRoundedIcon from "@material-ui/icons/AccountCircleRounded";
import { useSelector } from 'react-redux';
import { RootState } from '../../reducers/rootReducer';

const useStyles = makeStyles({
    root: {
        position: "fixed",
        bottom: "0%",
        width: "100%"
    }
});

export default function AppBottomNavigation() {
    const classes = useStyles();
    const appSettings = useSelector((state: RootState) => state.app.settings);
    const history = useHistory();
    const [value, setValue] = React.useState<paths>(paths.home);

    const openLink = (path: string) => () => {
        history.push(path);
    }

    const isRestricted = (path: string) => {
        if (appSettings.restrictedRoutes && Array.isArray(appSettings.restrictedRoutes)) {
            return appSettings.restrictedRoutes.indexOf(path as never) >= 0;
        } else {
            return false;
        }
    }

    return (
        <BottomNavigation
            value={value}
            onChange={(event, newValue) => {
                setValue(newValue)//locations.indexOf(history.location.pathname));
            }}
            className={classes.root}
        >
            {!isRestricted(paths.items) && <BottomNavigationAction onClick={openLink(paths.items)} value={paths.items} label="Inventory" icon={<CalendarViewDay />} />}
            {!isRestricted(paths.billsHome) && <BottomNavigationAction onClick={openLink(paths.billsHome)} value={paths.billsHome} label="Bills" icon={<Receipt />} />}
            {!isRestricted(paths.home) && <BottomNavigationAction onClick={openLink(paths.home)} value={paths.home} label="Home" icon={<Home />} />}
            {!isRestricted(paths.customer) && <BottomNavigationAction onClick={openLink(paths.customer)} value={paths.customer} label="Customer" icon={<RecentActors />} />}
            {!isRestricted(paths.account) && <BottomNavigationAction onClick={openLink(paths.account)} value={paths.account} label="Account" icon={<AccountCircleRoundedIcon />} />}
        </BottomNavigation>
    );
}