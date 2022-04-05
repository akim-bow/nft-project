import React from 'react';
import {Box} from "@mui/material";

interface Props {
    children: React.ReactNode,
}

function Layout({children}: Props) {
    return (
        <Box sx={{display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "10vh"}}>
            {children}
        </Box>
    );
}

export default Layout;
