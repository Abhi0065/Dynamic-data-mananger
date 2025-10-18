"use client";

import * as React from "react";
import { Brightness4, Brightness7 } from "@mui/icons-material";
import { useTheme, IconButton } from "@mui/material";
import { ThemeContext } from "./providers";

export function ThemeToggleButton() {
  const theme = useTheme();
  const colorMode = React.useContext(ThemeContext);

  return (
    <IconButton sx={{ ml: 1 }} onClick={colorMode.toggleTheme} color="inherit">
      {theme.palette.mode === "dark" ? <Brightness7 /> : <Brightness4 />}
    </IconButton>
  );
}
