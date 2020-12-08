import React from 'react';
import Card from '@material-ui/core/Card';
import CardActionArea from '@material-ui/core/CardActionArea';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';

export default function HomeCard(props: { classes?: any; onClick: any; title?: any; content?: any; }) {
    return (
        <Card className={props.classes || ""} style={{ height: "100%" }}>
            <CardActionArea onClick={props.onClick}>
                <CardContent>
                    <Typography gutterBottom variant="h5" component="h2">
                        {props.title || ""}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" component="p">
                        {props.content || ""}
                    </Typography>
                </CardContent>
            </CardActionArea>
        </Card>
    );
}
