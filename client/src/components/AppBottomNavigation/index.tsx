import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import BottomNavigation from '@material-ui/core/BottomNavigation';
import BottomNavigationAction from '@material-ui/core/BottomNavigationAction';
import { CalendarViewDay, Home, Receipt, RecentActors } from '@material-ui/icons';
import { useHistory } from 'react-router-dom';
import { paths } from '../../routes/paths.enum';

const useStyles = makeStyles({
    root: {
        width: "100%",
        top: "90%",
        position: "sticky",
        bottom: "0%",
    }
});

export default function AppBottomNavigation() {
    const classes = useStyles();
    const history = useHistory();
    // eslint-disable-next-line
    const [value, setValue] = React.useState(0);
    const locations = [paths.home,
    paths.billsHome,
    paths.customer,
    paths.items].map(e => e + "");
    const openLink = (path: string) => () => {
        history.push(path);
    }

    return (
        <BottomNavigation
            value={locations.indexOf(history.location.pathname)}
            onChange={(event, newValue) => {

                setValue(locations.indexOf(history.location.pathname));
            }}
            showLabels
            className={classes.root}
        >
            <BottomNavigationAction onClick={openLink(paths.home)} label="Home" icon={<Home />} />
            <BottomNavigationAction onClick={openLink(paths.billsHome)} label="Bills" icon={<Receipt />} />
            <BottomNavigationAction onClick={openLink(paths.customer)} label="Customer" icon={<RecentActors />} />
            <BottomNavigationAction onClick={openLink(paths.items)} label="Inventory" icon={<CalendarViewDay />} />
        </BottomNavigation>
    );
}