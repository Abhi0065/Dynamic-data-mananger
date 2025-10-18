import { configureStore } from "@reduxjs/toolkit";
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import tableReducer from "../tableSlice";

const getStorage = () => {
  if (typeof window !== "undefined") {
    return require("redux-persist/lib/storage").default;
  }
  return {
    getItem: (_key: any) => Promise.resolve(null),
    setItem: (_key: any, value: any) => Promise.resolve(value),
    removeItem: (_key: any) => Promise.resolve(),
  };
};

const persistConfig = {
  key: "root",
  storage: getStorage(),
  whitelist: ["columns", "data", "editedRows"],
};

const persistedTableReducer = persistReducer(persistConfig, tableReducer);

const store = configureStore({
  reducer: {
    table: persistedTableReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export { store, persistor };
