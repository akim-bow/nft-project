import React from 'react';
import {Box} from "@mui/material";

interface Props {
    children: React.ReactNode,
}

function Layout({children}: Props) {
    return (
        <Box sx={{display: "flex"}}>
            {children}
        </Box>
    );
}

export default Layout;
