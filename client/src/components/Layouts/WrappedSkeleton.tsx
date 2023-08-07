import React from 'react'
import { Skeleton, SkeletonProps } from '@material-ui/lab'

export default function WrappedSkeleton({ loading = true, children, ...rest }: React.PropsWithChildren<SkeletonProps & { loading?: boolean }>) {
    return (<>
        {loading ? <Skeleton animation="wave" {...rest} /> : children}
    </>
    )
}
