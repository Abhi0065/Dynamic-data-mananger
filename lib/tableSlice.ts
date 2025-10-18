import { createSlice, PayloadAction, createSelector } from "@reduxjs/toolkit";
import { initialData, defaultColumns } from "@/lib/initial-data";
import type { Person, ColumnConfig } from "@/lib/types";
import { RootState } from "./store/store";

interface TableState {
  data: Person[];
  columns: ColumnConfig[];
  globalFilter: string;
  editedRows: Record<string, Partial<Person>>;
}

const allPossibleColumns = Array.from(
  new Set(initialData.flatMap(Object.keys).concat(["department", "location"]))
).filter((column) => column !== "id");

const initialColumns: ColumnConfig[] = allPossibleColumns.map((key) => ({
  id: key,
  label: key.charAt(0).toUpperCase() + key.slice(1),
  visible: defaultColumns.includes(key as keyof Person),
}));

const initialState: TableState = {
  data: initialData,
  columns: initialColumns,
  globalFilter: "",
  editedRows: {},
};

const tableSlice = createSlice({
  name: "table",
  initialState,
  reducers: {
    setData: (state, action: PayloadAction<Person[]>) => {
      // CRITICAL FIX: Ensure columns is always an array
      if (!Array.isArray(state.columns)) {
        state.columns = [];
      }

      const newColumns = new Set<string>();
      action.payload.forEach((row) => {
        Object.keys(row).forEach((key) => {
          if (key !== "id" && !state.columns.some((c) => c.id === key)) {
            newColumns.add(key);
          }
        });
      });

      newColumns.forEach((newColumnId) => {
        state.columns.push({
          id: newColumnId,
          label: newColumnId.charAt(0).toUpperCase() + newColumnId.slice(1),
          visible: true,
        });
      });

      state.data = action.payload;
    },
    setGlobalFilter: (state, action: PayloadAction<string>) => {
      state.globalFilter = action.payload;
    },
    setColumnVisibility: (
      state,
      action: PayloadAction<{ id: string; isVisible: boolean }>
    ) => {
      const { id, isVisible } = action.payload;

      // Safety check
      if (!Array.isArray(state.columns)) {
        state.columns = [];
        return;
      }

      const column = state.columns.find((c) => c.id === id);
      if (column) {
        column.visible = isVisible;
      }
    },
    addColumn: (state, action: PayloadAction<string>) => {
      // Safety check
      if (!Array.isArray(state.columns)) {
        state.columns = [];
      }

      const newColumnId = action.payload.toLowerCase().replace(/\s/g, "_");
      if (!state.columns.some((c) => c.id === newColumnId)) {
        state.columns.push({
          id: newColumnId,
          label: action.payload,
          visible: true,
        });
        state.data.forEach((row) => {
          (row as any)[newColumnId] = "";
        });
      }
    },
    reorderColumns: (state, action: PayloadAction<ColumnConfig[]>) => {
      // Validate payload is an array
      if (Array.isArray(action.payload)) {
        state.columns = action.payload;
      }
    },
    updateCellValue: (
      state,
      action: PayloadAction<{ rowId: string; columnId: string; value: any }>
    ) => {
      const { rowId, columnId, value } = action.payload;
      const originalRow = state.data.find((row) => row.id === rowId);

      if (
        originalRow &&
        String((originalRow as any)[columnId] || "") !== String(value)
      ) {
        if (!state.editedRows[rowId]) {
          state.editedRows[rowId] = {};
        }
        (state.editedRows[rowId] as any)[columnId] = value;
      } else if (
        originalRow &&
        state.editedRows[rowId] &&
        String((originalRow as any)[columnId] || "") === String(value)
      ) {
        delete (state.editedRows[rowId] as any)[columnId];
        if (Object.keys(state.editedRows[rowId]).length === 0) {
          delete state.editedRows[rowId];
        }
      }
    },
    updateRow: (state, action: PayloadAction<Person>) => {
      const index = state.data.findIndex((row) => row.id === action.payload.id);
      if (index !== -1) {
        state.data[index] = action.payload;
      }
    },
    applyChanges: (
      state,
      action: PayloadAction<{ rowIds?: string[] } | undefined>
    ) => {
      const rowIdsToApply =
        action.payload?.rowIds || Object.keys(state.editedRows);

      state.data = state.data.map((row) => {
        if (rowIdsToApply.includes(row.id) && state.editedRows[row.id]) {
          return { ...row, ...state.editedRows[row.id] };
        }
        return row;
      });

      rowIdsToApply.forEach((rowId) => {
        delete state.editedRows[rowId];
      });
    },
    revertChanges: (
      state,
      action: PayloadAction<{ rowIds?: string[] } | undefined>
    ) => {
      const rowIdsToRevert =
        action.payload?.rowIds || Object.keys(state.editedRows);
      rowIdsToRevert.forEach((rowId) => {
        delete state.editedRows[rowId];
      });
    },
    deleteRow: (state, action: PayloadAction<string>) => {
      state.data = state.data.filter((row) => row.id !== action.payload);
      if (state.editedRows[action.payload]) {
        delete state.editedRows[action.payload];
      }
    },
    deleteRows: (state, action: PayloadAction<string[]>) => {
      const idsToDelete = new Set(action.payload);
      state.data = state.data.filter((row) => !idsToDelete.has(row.id));
      idsToDelete.forEach((id) => {
        if (state.editedRows[id]) {
          delete state.editedRows[id];
        }
      });
    },
  },
});

export const {
  setData,
  setGlobalFilter,
  setColumnVisibility,
  addColumn,
  reorderColumns,
  updateCellValue,
  updateRow,
  applyChanges,
  revertChanges,
  deleteRow,
  deleteRows,
} = tableSlice.actions;

const selectData = (state: RootState) => state.table.data;
const selectGlobalFilter = (state: RootState) => state.table.globalFilter;
const selectEditedRows = (state: RootState) => state.table.editedRows;

export const selectFilteredData = createSelector(
  [selectData, selectGlobalFilter, selectEditedRows],
  (data, globalFilter, editedRows) => {
    const dataWithEdits = data.map((row) =>
      editedRows[row.id] ? { ...row, ...editedRows[row.id] } : row
    );

    if (!globalFilter) {
      return dataWithEdits;
    }

    const lowercasedFilter = globalFilter.toLowerCase();
    return dataWithEdits.filter((row) =>
      Object.values(row).some((value) =>
        String(value).toLowerCase().includes(lowercasedFilter)
      )
    );
  }
);

export default tableSlice.reducer;
