import React, { useEffect } from 'react';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import List from '@material-ui/core/List';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import Checkbox from '@material-ui/core/Checkbox';
import Button from '@material-ui/core/Button';
import Divider from '@material-ui/core/Divider';
import { UserData } from '../../reducers/auth.reducer';
import { useSelector } from 'react-redux';
import { RootState } from '../../reducers/rootReducer';
import { CircularProgress, Zoom } from '@material-ui/core';

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        root: {
            margin: 'auto',
        },
        cardHeader: {
            padding: theme.spacing(1, 2),
        },
        list: {
            width: 200,
            height: 230,
            backgroundColor: theme.palette.background.paper,
            overflow: 'auto',
        },
        button: {
            margin: theme.spacing(0.5, 0),
        },
    }),
);

function not(a: UserData[], b: UserData[]) {
    return a.filter((value) => b.indexOf(value) === -1);
}

function intersection(a: UserData[], b: UserData[]) {
    return a.filter((value) => b.indexOf(value) !== -1);
}

function union(a: UserData[], b: UserData[]) {
    return [...a, ...not(b, a)];
}

export default function UsersTransferList(props: { onListUpdate: (usersList: UserData[]) => void; value?: UserData[] }) {
    const classes = useStyles();
    const usersUnderAdmin = useSelector((state: RootState) => state.auth.usersUnderUser);
    const [checked, setChecked] = React.useState<UserData[]>([]);
    const [left, setLeft] = React.useState(usersUnderAdmin ?? []);
    const [right, setRight] = React.useState<UserData[]>([]);

    useEffect(() => {
        props.onListUpdate(right);
        //eslint-disable-next-line
    }, [right])

    const leftChecked = intersection(checked, left);
    const rightChecked = intersection(checked, right);

    useEffect(() => {
        if (props.value) {
            setRight(props.value);
            setLeft(left.filter((leftValue) => props.value?.findIndex(rightValue => leftValue._id === rightValue._id) === -1));
        }
        //eslint-disable-next-line
    }, [])

    if (usersUnderAdmin === null) {
        return (<Zoom in={true}><CircularProgress /></Zoom>)
    }

    const handleToggle = (value: UserData) => () => {
        const currentIndex = checked.indexOf(value);
        const newChecked = [...checked];

        if (currentIndex === -1) {
            newChecked.push(value);
        } else {
            newChecked.splice(currentIndex, 1);
        }

        setChecked(newChecked);
    };

    const numberOfChecked = (items: UserData[]) => intersection(checked, items).length;

    const handleToggleAll = (items: UserData[]) => () => {
        if (numberOfChecked(items) === items.length) {
            setChecked(not(checked, items));
        } else {
            setChecked(union(checked, items));
        }
    };

    const handleCheckedRight = () => {
        const newRight = right.concat(leftChecked);
        setRight(newRight);
        setLeft(not(left, leftChecked));
        setChecked(not(checked, leftChecked));
    };

    const handleCheckedLeft = () => {
        setLeft(left.concat(rightChecked));
        setRight(not(right, rightChecked));
        setChecked(not(checked, rightChecked));
    };

    const customList = (title: React.ReactNode, items: UserData[]) => (
        <Card>
            <CardHeader
                className={classes.cardHeader}
                avatar={
                    <Checkbox
                        onClick={handleToggleAll(items)}
                        checked={numberOfChecked(items) === items.length && items.length !== 0}
                        indeterminate={numberOfChecked(items) !== items.length && numberOfChecked(items) !== 0}
                        disabled={items.length === 0}
                        inputProps={{ 'aria-label': 'all users selected' }}
                    />
                }
                title={title}
                subheader={`${numberOfChecked(items)}/${items.length} selected`}
            />
            <Divider />
            <List className={classes.list} dense component="div" role="list">
                {items.map((value: UserData, key) => {
                    const labelId = `transfer-list-all-item-${value._id}-label`;

                    return (
                        <ListItem key={key} role="listitem" button onClick={handleToggle(value)}>
                            <ListItemIcon>
                                <Checkbox
                                    checked={checked.indexOf(value) !== -1}
                                    tabIndex={-1}
                                    disableRipple
                                    inputProps={{ 'aria-labelledby': labelId }}
                                />
                            </ListItemIcon>
                            <ListItemText id={labelId} primary={value.name} />
                        </ListItem>
                    );
                })}
                <ListItem />
            </List>
        </Card>
    );

    return (
        <Grid container spacing={2} justify="center" alignItems="center" className={classes.root}>
            <Grid item>{customList('Users', left)}</Grid>
            <Grid item>
                <Grid container direction="column" alignItems="center">
                    <Button
                        variant="outlined"
                        size="small"
                        className={classes.button}
                        onClick={handleCheckedRight}
                        disabled={leftChecked.length === 0}
                        aria-label="move selected right"
                    >
                        &gt;
          </Button>
                    <Button
                        variant="outlined"
                        size="small"
                        className={classes.button}
                        onClick={handleCheckedLeft}
                        disabled={rightChecked.length === 0}
                        aria-label="move selected left"
                    >
                        &lt;
          </Button>
                </Grid>
            </Grid>
            <Grid item>{customList('Chosen', right)}</Grid>
        </Grid>
    );
}