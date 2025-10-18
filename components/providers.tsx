"use client";

import * as React from "react";
import { Provider as ReduxProvider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import {
  ThemeProvider as MuiThemeProvider,
  createTheme,
  CssBaseline,
  PaletteMode,
} from "@mui/material";

import { store, persistor } from "@/lib/store/store";

export const ThemeContext = React.createContext({
  toggleTheme: () => {},
});

const getTheme = (mode: PaletteMode) =>
  createTheme({
    palette: {
      mode,
      primary: {
        main: "#29ABE2",
      },
      secondary: {
        main: mode === "light" ? "#F5F5F5" : "#121212",
      },
      warning: {
        main: "#FF9800",
      },
      background: {
        default: mode === "light" ? "#F5F5F5" : "#121212",
        paper: mode === "light" ? "#ffffff" : "#1E1E1E",
      },
    },
    typography: {
      fontFamily: "Inter, sans-serif",
      h1: { fontFamily: "Space Grotesk, sans-serif" },
      h2: { fontFamily: "Space Grotesk, sans-serif" },
      h3: { fontFamily: "Space Grotesk, sans-serif" },
      h4: { fontFamily: "Space Grotesk, sans-serif" },
      h5: { fontFamily: "Space Grotesk, sans-serif" },
      h6: { fontFamily: "Space Grotesk, sans-serif" },
    },
  });

export function Providers({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = React.useState<PaletteMode>("light");

  const theme = React.useMemo(() => getTheme(mode), [mode]);

  const colorMode = React.useMemo(
    () => ({
      toggleTheme: () => {
        setMode((prevMode) => (prevMode === "light" ? "dark" : "light"));
      },
    }),
    []
  );

  return (
    <ReduxProvider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ThemeContext.Provider value={colorMode}>
          <MuiThemeProvider theme={theme}>
            <CssBaseline />
            {children}
          </MuiThemeProvider>
        </ThemeContext.Provider>
      </PersistGate>
    </ReduxProvider>
  );
}
