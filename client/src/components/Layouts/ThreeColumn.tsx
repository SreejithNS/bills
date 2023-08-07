import React from 'react'
import { Box } from '@material-ui/core'

function ThreeColumn(props: React.PropsWithChildren<{
    navigation: React.ReactNode;
}>) {
    return (
        <Box display="flex">
            <Box width={256} flexShrink={0}>
                {props.navigation}
            </Box>
            <Box flexGrow={1} paddingX={4}>
                {props.children}
            </Box>
        </Box>
    )
}

export default ThreeColumn