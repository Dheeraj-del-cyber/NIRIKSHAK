import React, { useState } from 'react';
import {
    AppBar,
    Toolbar,
    Typography,
    IconButton,
    Drawer,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Box,
    Chip,
    Divider,
    Stack,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import HubIcon from '@mui/icons-material/Hub';
import AccountTreeIcon from '@mui/icons-material/AccountTree';

const HEADER_HEIGHT = 64;
const FOOTER_HEIGHT = 48;

const NAV_ITEMS = [
    {
        id: 'reconciliation',
        label: 'GST Reconciliation',
        description: 'Invoice ↔ GSTR-2B mismatch detection',
        icon: <FactCheckIcon />,
    },
    {
        id: 'revenue-risk',
        label: 'Revenue Leakage & Risk',
        description: 'Discounts, refunds, overdue payments, churn',
        icon: <TrendingDownIcon />,
    },
    {
        id: 'digital-twin',
        label: 'Digital Twin & Expected Revenue',
        description: '"What you should have earned" vs. actual',
        icon: <HubIcon />,
    },
    {
        id: 'hidden-leakage',
        label: 'Hidden Leakage & Chain Detection',
        description: 'Leaks only visible when signals are connected',
        icon: <AccountTreeIcon />,
    },
];

export default function AppLayout({ activeSection, onSectionChange, children }) {
    const [drawerOpen, setDrawerOpen] = useState(false);

    const current = NAV_ITEMS.find((n) => n.id === activeSection) || NAV_ITEMS[0];

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
            <AppBar
                position="fixed"
                elevation={0}
                sx={{
                    height: HEADER_HEIGHT,
                    justifyContent: 'center',
                    background: 'linear-gradient(90deg, #0F4C5C 0%, #12707F 100%)',
                }}
            >
                <Toolbar>
                    <IconButton
                        edge="start"
                        color="inherit"
                        aria-label="open navigation menu"
                        onClick={() => setDrawerOpen(true)}
                        sx={{ mr: 1.5 }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <VisibilityIcon sx={{ mr: 1.25 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: 0.5 }}>
                        NIRIKSHAK
                    </Typography>
                    <Box sx={{ flexGrow: 1 }} />
                    <Chip
                        size="small"
                        label={current.label}
                        sx={{ bgcolor: 'rgba(255,255,255,0.18)', color: 'white', fontWeight: 600, display: { xs: 'none', sm: 'flex' } }}
                    />
                </Toolbar>
            </AppBar>

            <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
                <Box sx={{ width: 300 }} role="presentation">
                    <Box sx={{ px: 2.5, py: 2.5, background: 'linear-gradient(90deg, #0F4C5C 0%, #12707F 100%)' }}>
                        <Stack direction="row" spacing={1.25} alignItems="center">
                            <VisibilityIcon sx={{ color: 'white' }} />
                            <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>
                                NIRIKSHAK
                            </Typography>
                        </Stack>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)' }}>
                            AI-powered revenue assurance
                        </Typography>
                    </Box>
                    <Divider />
                    <List sx={{ py: 1 }}>
                        {NAV_ITEMS.map((item) => (
                            <ListItemButton
                                key={item.id}
                                selected={item.id === activeSection}
                                onClick={() => {
                                    onSectionChange(item.id);
                                    setDrawerOpen(false);
                                }}
                                sx={{
                                    mx: 1,
                                    my: 0.5,
                                    borderRadius: 2,
                                    '&.Mui-selected': { bgcolor: 'primary.main', color: 'white' },
                                    '&.Mui-selected .MuiListItemIcon-root': { color: 'white' },
                                    '&.Mui-selected:hover': { bgcolor: 'primary.dark' },
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                                <ListItemText primary={item.label} secondary={item.id === activeSection ? undefined : item.description} />
                            </ListItemButton>
                        ))}
                    </List>
                </Box>
            </Drawer>

            <Box
                component="main"
                sx={{
                    pt: `${HEADER_HEIGHT + 24}px`,
                    pb: `${FOOTER_HEIGHT + 24}px`,
                    minHeight: '100vh',
                    boxSizing: 'border-box',
                }}
            >
                {children}
            </Box>

            <Box
                component="footer"
                sx={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: FOOTER_HEIGHT,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    px: 2,
                    bgcolor: 'grey.900',
                    color: 'grey.300',
                    zIndex: (theme) => theme.zIndex.appBar,
                }}
            >
                <Typography variant="caption" sx={{ textAlign: 'center' }}>
                    NIRIKSHAK — AI-Powered Revenue Assurance · prototype build, not production-audited
                </Typography>
            </Box>
        </Box>
    );
}