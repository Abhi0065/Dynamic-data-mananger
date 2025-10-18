import { DataTable } from "@/components/data-table";
import { Typography, Container, AppBar, Toolbar, Box } from "@mui/material";
import { ThemeToggleButton } from "@/components/theme-toggle-button";

export default function Home() {
  return (
    <>
      <AppBar position="static" color="transparent" elevation={1}>
        <Toolbar>
          <Typography
            variant="h4"
            component="h1"
            fontWeight="bold"
            sx={{ flexGrow: 1, fontFamily: "Space Grotesk" }}
          >
            Dynamic Data Table Manager
          </Typography>
          <ThemeToggleButton />
        </Toolbar>
      </AppBar>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <DataTable />
      </Container>
    </>
  );
}
