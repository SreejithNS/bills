import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import BottomNavigation from '@material-ui/core/BottomNavigation';
import BottomNavigationAction from '@material-ui/core/BottomNavigationAction';
import { CalendarViewDay, Home, Receipt, RecentActors } from '@material-ui/icons';
import { useHistory } from 'react-router-dom';
import { paths } from '../../routes/paths.enum';
import AccountCircleRoundedIcon from "@material-ui/icons/AccountCircleRounded";

const useStyles = makeStyles({
    root: {
        position: "fixed",
        bottom: "0%",
        width: "100%"
    }
});

export default function AppBottomNavigation() {
    const classes = useStyles();
    const history = useHistory();
    const [value, setValue] = React.useState<paths>(paths.home);
    const openLink = (path: string) => () => {
        history.push(path);
    }

    return (
        <BottomNavigation
            value={value}
            onChange={(event, newValue) => {
                setValue(newValue)//locations.indexOf(history.location.pathname));
            }}
            className={classes.root}
        >
            <BottomNavigationAction onClick={openLink(paths.items)} value={paths.items} label="Inventory" icon={<CalendarViewDay />} />
            <BottomNavigationAction onClick={openLink(paths.billsHome)} value={paths.billsHome} label="Bills" icon={<Receipt />} />
            <BottomNavigationAction onClick={openLink(paths.home)} value={paths.home} label="Home" icon={<Home />} />
            <BottomNavigationAction onClick={openLink(paths.customer)} value={paths.customer} label="Customer" icon={<RecentActors />} />
            <BottomNavigationAction onClick={openLink(paths.account)} value={paths.account} label="Account" icon={<AccountCircleRoundedIcon />} />
        </BottomNavigation>
    );
}