"use client";

import * as React from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  DataGrid,
  GridColDef,
  GridRowSelectionModel,
  useGridApiRef,
  GridRowModel,
  GridActionsCellItem,
  GridRowId,
  GridRowModes,
  GridRowModesModel,
  GridEventListener,
  GridCellParams,
  GridValidRowModel,
  GridRenderCellParams,
  GridValueGetterParams,
} from "@mui/x-data-grid";
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Snackbar,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  FormControlLabel,
  Checkbox,
  DialogTitle,
  MenuItem,
  Typography,
  Divider,
  List,
  ListItem,
} from "@mui/material";
import {
  Search,
  Clear,
  FileUpload,
  FileDownload,
  Delete,
  Edit,
  Settings,
  Add,
  DragIndicator,
  Save,
  Cancel,
} from "@mui/icons-material";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  setData,
  addColumn,
  selectFilteredData,
  setGlobalFilter,
  deleteRows,
  deleteRow,
  setColumnVisibility,
  reorderColumns,
  updateCellValue,
  applyChanges,
  revertChanges,
  updateRow,
} from "@/lib/tableSlice";
import { RootState, AppDispatch } from "@/lib/store/store";
import type { Person, ColumnConfig } from "@/lib/types";
import { ImportCSVDialog } from "./import-csv-dialog";

function DraggableColumn({
  id,
  column,
  onToggle,
}: {
  id: string;
  column: ColumnConfig;
  onToggle: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const itemStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <ListItem
      ref={setNodeRef}
      style={itemStyle}
      sx={{
        bgcolor: "background.paper",
        mb: 0.5,
        borderRadius: 1,
        border: "1px solid",
        borderColor: "divider",
      }}
      data-testid={`column-item-${column.id}`}
    >
      <IconButton size="small" {...attributes} {...listeners} sx={{ mr: 1 }}>
        <DragIndicator />
      </IconButton>
      <FormControlLabel
        control={
          <Checkbox
            checked={column.visible}
            onChange={onToggle}
            data-testid={`checkbox-column-${column.id}`}
          />
        }
        label={column.label}
        sx={{ flex: 1 }}
      />
    </ListItem>
  );
}

function ManageColumnsDialog() {
  const dispatch = useDispatch<AppDispatch>();
  const { columns } = useSelector((state: RootState) => state.table);
  const columnOrder = Array.isArray(columns)
    ? columns.map((c: ColumnConfig) => c.id)
    : [];

  const [newColumnName, setNewColumnName] = React.useState("");
  const [newColumnType, setNewColumnType] = React.useState<
    "string" | "number" | "email" | "select"
  >("string");
  const [toast, setToast] = React.useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });
  const [isOpen, setIsOpen] = React.useState(false);

  const dragSensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const onDragComplete = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && Array.isArray(columns)) {
      const oldIndex = columnOrder.indexOf(active.id as string);
      const newIndex = columnOrder.indexOf(over.id as string);
      const reorderedColumnsList = arrayMove(columns, oldIndex, newIndex);
      dispatch(reorderColumns(reorderedColumnsList));
    }
  };

  const handleToastClose = () => {
    setToast({ ...toast, open: false });
  };

  const handleAddNewColumn = () => {
    if (!newColumnName.trim()) {
      setToast({
        open: true,
        message: "Column Name cannot be empty.",
        severity: "error",
      });
      return;
    }

    const columnExists =
      Array.isArray(columns) &&
      columns.some(
        (col: any) =>
          col.label.toLowerCase() === newColumnName.trim().toLowerCase()
      );
    if (columnExists) {
      setToast({
        open: true,
        message: "A column with this name already exists.",
        severity: "error",
      });
      return;
    }

    dispatch(addColumn(newColumnName));
    setNewColumnName("");
    setNewColumnType("string");
    setToast({
      open: true,
      message: `Column "${newColumnName}" added.`,
      severity: "success",
    });
  };

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        onClick={() => setIsOpen(true)}
        startIcon={<Settings />}
      >
        Manage Columns
      </Button>
      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        maxWidth="sm"
        fullWidth
        data-testid="dialog-manage-columns"
      >
        <DialogTitle>Manage Columns</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Add New Column
            </Typography>
            <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
              <TextField
                label="Column Name"
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                size="small"
                sx={{ flex: 1 }}
                placeholder="e.g., Department, Location"
                data-testid="input-field-name"
              />
              <TextField
                select
                label="Type"
                value={newColumnType}
                onChange={(e) => setNewColumnType(e.target.value as any)}
                size="small"
                sx={{ width: 120 }}
                data-testid="select-field-type"
              >
                <MenuItem value="string">Text</MenuItem>
                <MenuItem value="number">Number</MenuItem>
                <MenuItem value="email">Email</MenuItem>
              </TextField>
              <Button
                variant="contained"
                onClick={handleAddNewColumn}
                startIcon={<Add />}
                data-testid="button-add-field"
              >
                Add
              </Button>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography variant="h6" gutterBottom>
            Column Visibility &amp; Order
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Drag to reorder, check/uncheck to show/hide
          </Typography>

          <DndContext
            sensors={dragSensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragComplete}
          >
            <SortableContext
              items={columnOrder}
              strategy={verticalListSortingStrategy}
            >
              <List sx={{ maxHeight: 300, overflow: "auto" }}>
                {Array.isArray(columns) &&
                  columns.map((column: ColumnConfig) => (
                    <DraggableColumn
                      key={column.id}
                      id={column.id}
                      column={column}
                      onToggle={() =>
                        dispatch(
                          setColumnVisibility({
                            id: column.id,
                            isVisible: !column.visible,
                          })
                        )
                      }
                    />
                  ))}
              </List>
            </SortableContext>
          </DndContext>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setIsOpen(false)}
            data-testid="button-close-manage-columns"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={toast.open}
        autoHideDuration={6000}
        onClose={handleToastClose}
      >
        <Alert
          onClose={handleToastClose}
          severity={toast.severity}
          sx={{ width: "100%" }}
          variant="filled"
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </>
  );
}

const ToolbarComponent = React.memo(
  (props: {
    selectedRows: GridRowSelectionModel;
    onClearSelection: () => void;
    showToast: (message: string, severity: "success" | "error") => void;
    hasEdits: boolean;
  }) => {
    const { selectedRows, onClearSelection, showToast, hasEdits } = props;
    const dispatch = useDispatch<AppDispatch>();
    const { globalFilter, data, columns } = useSelector(
      (state: RootState) => state.table
    );
    const hasSelection = selectedRows.length > 0;
    const [isDeleteConfirmationOpen, setDeleteConfirmationOpen] =
      React.useState(false);
    const [isImporting, setIsImporting] = React.useState(false);
    const [saveConfirmOpen, setSaveConfirmOpen] = React.useState(false);
    const [cancelConfirmOpen, setCancelConfirmOpen] = React.useState(false);

    const handleExport = () => {
      try {
        const visibleColumns = Array.isArray(columns)
          ? columns
              .filter((c: ColumnConfig) => c.visible)
              .map((c: ColumnConfig) => c.id)
          : [];

        const dataToExport = Array.isArray(data)
          ? data.map((row: Person) => {
              const filteredRow: any = {};
              visibleColumns.forEach((columnId: string) => {
                if (columnId !== "actions") {
                  filteredRow[columnId] = row[columnId as keyof Person] || "";
                }
              });
              return filteredRow;
            })
          : [];

        if (dataToExport.length === 0) {
          showToast("No data to export.", "error");
          return;
        }

        // Convert to CSV manually
        const headers = visibleColumns.filter((col) => col !== "actions");
        const csvRows = [headers.join(",")];

        dataToExport.forEach((row: any) => {
          const values = headers.map((header) => {
            const value = row[header] || "";
            // Escape values that contain commas, quotes, or newlines
            const stringValue = String(value);
            if (
              stringValue.includes(",") ||
              stringValue.includes('"') ||
              stringValue.includes("\n")
            ) {
              return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
          });
          csvRows.push(values.join(","));
        });

        const csv = csvRows.join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `export_${new Date().getTime()}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showToast("Your data has been exported.", "success");
      } catch (error) {
        console.error("Export error:", error);
        showToast("Failed to export data.", "error");
      }
    };

    const handleDeleteSelectedRows = () => {
      dispatch(deleteRows(selectedRows as string[]));
      showToast(`${selectedRows.length} rows deleted.`, "success");
      setDeleteConfirmationOpen(false);
      onClearSelection();
    };

    const handleSaveAll = () => {
      dispatch(applyChanges());
      showToast("All changes saved successfully.", "success");
      setSaveConfirmOpen(false);
    };

    const handleCancelAll = () => {
      dispatch(revertChanges());
      showToast("All changes have been reverted.", "success");
      setCancelConfirmOpen(false);
    };

    return (
      <Box sx={{ p: 1, display: "flex", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <TextField
            variant="outlined"
            size="small"
            placeholder="Search all columns..."
            value={globalFilter ?? ""}
            onChange={(e) => dispatch(setGlobalFilter(e.target.value))}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
              endAdornment: globalFilter && (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => dispatch(setGlobalFilter(""))}
                    size="small"
                  >
                    <Clear />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ width: "300px" }}
          />
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {hasEdits && (
            <>
              <Button
                variant="contained"
                color="primary"
                size="small"
                onClick={() => setSaveConfirmOpen(true)}
              >
                Save All
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={() => setCancelConfirmOpen(true)}
                sx={{
                  backgroundColor: "#f44336",
                  color: "#ffffff",
                  "&:hover": {
                    backgroundColor: "#d32f2f",
                  },
                }}
              >
                Cancel All
              </Button>
            </>
          )}
          {hasSelection && (
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={() => setDeleteConfirmationOpen(true)}
              startIcon={<Delete />}
            >
              Delete Selected
            </Button>
          )}
          <Button
            variant="outlined"
            size="small"
            onClick={() => setIsImporting(true)}
            startIcon={<FileUpload />}
          >
            Import
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={handleExport}
            startIcon={<FileDownload />}
          >
            Export
          </Button>
          <ManageColumnsDialog />
        </Box>
        <ImportCSVDialog
          open={isImporting}
          onClose={() => setIsImporting(false)}
        />
        <Dialog
          open={isDeleteConfirmationOpen}
          onClose={() => setDeleteConfirmationOpen(false)}
        >
          <DialogTitle>Are you absolutely sure?</DialogTitle>
          <DialogContent>
            <DialogContentText>
              This action cannot be undone. This will permanently delete the{" "}
              {selectedRows.length} selected row(s).
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteConfirmationOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleDeleteSelectedRows} color="error">
              Delete
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog
          open={saveConfirmOpen}
          onClose={() => setSaveConfirmOpen(false)}
        >
          <DialogTitle>Confirm Save</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to save all changes?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSaveConfirmOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveAll} color="primary">
              Save
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog
          open={cancelConfirmOpen}
          onClose={() => setCancelConfirmOpen(false)}
        >
          <DialogTitle>Confirm Cancel</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to discard all changes?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCancelConfirmOpen(false)}>Cancel</Button>
            <Button onClick={handleCancelAll} color="error">
              Discard
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }
);
ToolbarComponent.displayName = "Toolbar";

export function DataTable() {
  const dispatch = useDispatch<AppDispatch>();
  const columns = useSelector((state: RootState) => state.table.columns);
  const editedRows = useSelector((state: RootState) => state.table.editedRows);
  const filteredData = useSelector(selectFilteredData);
  const apiRef = useGridApiRef();

  const [selection, setSelection] = React.useState<GridRowSelectionModel>([]);
  const [toast, setToast] = React.useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });
  const [rowModesModel, setRowModesModel] = React.useState<GridRowModesModel>(
    {}
  );

  const [rowSaveConfirm, setRowSaveConfirm] = React.useState<{
    open: boolean;
    rowId: GridRowId | null;
  }>({ open: false, rowId: null });
  const [rowCancelConfirm, setRowCancelConfirm] = React.useState<{
    open: boolean;
    rowId: GridRowId | null;
  }>({ open: false, rowId: null });
  const [deleteConfirm, setDeleteConfirm] = React.useState<{
    open: boolean;
    rowId: GridRowId | null;
  }>({ open: false, rowId: null });

  const showToast = React.useCallback(
    (message: string, severity: "success" | "error") => {
      setToast({ open: true, message, severity });
    },
    []
  );

  const handleRowEditStop: GridEventListener<"rowEditStop"> = (
    params,
    event
  ) => {
    if (params.reason === "rowFocusOut") {
      event.defaultMuiPrevented = true;
    }
  };

  const handleEditClick = (id: GridRowId) => () => {
    setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } });
  };

  const handleSaveClick = (id: GridRowId) => () => {
    setRowSaveConfirm({ open: true, rowId: id });
  };

  const confirmRowSave = () => {
    if (rowSaveConfirm.rowId) {
      setRowModesModel({
        ...rowModesModel,
        [rowSaveConfirm.rowId]: { mode: GridRowModes.View },
      });
    }
    setRowSaveConfirm({ open: false, rowId: null });
  };

  const handleDeleteClick = (id: GridRowId) => () => {
    setDeleteConfirm({ open: true, rowId: id });
  };

  const confirmDelete = () => {
    if (deleteConfirm.rowId) {
      dispatch(deleteRow(deleteConfirm.rowId as string));
      showToast("Row deleted.", "success");
    }
    setDeleteConfirm({ open: false, rowId: null });
  };

  const handleCancelClick = (id: GridRowId) => () => {
    setRowCancelConfirm({ open: true, rowId: id });
  };

  const confirmRowCancel = () => {
    if (rowCancelConfirm.rowId) {
      const id = rowCancelConfirm.rowId;
      setRowModesModel({
        ...rowModesModel,
        [id]: { mode: GridRowModes.View, ignoreModifications: true },
      });
      const editedRow = editedRows[id];
      if (editedRow && Object.keys(editedRow).length > 0) {
        dispatch(revertChanges({ rowIds: [id as string] }));
      }
    }
    setRowCancelConfirm({ open: false, rowId: null });
  };

  const processRowUpdate = (newRow: GridRowModel) => {
    const updatedRow = newRow as Person;
    dispatch(updateRow(updatedRow));
    if (editedRows[updatedRow.id]) {
      dispatch(applyChanges({ rowIds: [updatedRow.id as string] }));
    }
    showToast("Row saved successfully.", "success");
    return updatedRow;
  };

  const handleProcessRowUpdateError = (error: any) => {
    console.error("Error processing row update:", error);
    showToast("Failed to save row.", "error");
  };

  const handleCellEditStop: GridEventListener<"cellEditStop"> = (
    params,
    event
  ) => {
    if (params.reason === "enterKeyDown") {
      event.defaultMuiPrevented = true;
      return;
    }
  };

  const hasEdits = Object.keys(editedRows).length > 0;

  const columnsDef: GridColDef<Person>[] = React.useMemo(() => {
    // Ensure columns is an array before filtering
    if (!Array.isArray(columns) || columns.length === 0) {
      return [];
    }

    const visibleColumns = columns.filter((c) => c.visible);

    const dynamicColumns: GridColDef<Person>[] = visibleColumns.map(
      (columnDef: ColumnConfig) => ({
        field: columnDef.id,
        headerName: columnDef.label,
        flex: 1,
        minWidth: 150,
        sortable: true,
        hideable: true,
        editable: true,
      })
    );

    if (dynamicColumns.length === 0) return [];

    return [
      ...dynamicColumns,
      {
        field: "actions",
        type: "actions",
        headerName: "Actions",
        width: 120,
        align: "center",
        headerAlign: "center",
        getActions: ({ id }) => {
          const isInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit;

          if (isInEditMode) {
            return [
              <GridActionsCellItem
                key="save"
                icon={<Save />}
                label="Save"
                sx={{
                  color: "primary.main",
                }}
                onClick={handleSaveClick(id)}
              />,
              <GridActionsCellItem
                key="cancel"
                icon={<Cancel />}
                label="Cancel"
                sx={{
                  color: "#f44336",
                  "&:hover": {
                    backgroundColor: "rgba(244, 67, 54, 0.08)",
                  },
                }}
                onClick={handleCancelClick(id)}
              />,
            ];
          }

          return [
            <GridActionsCellItem
              key="edit"
              icon={<Edit />}
              label="Edit"
              onClick={handleEditClick(id)}
              color="inherit"
            />,
            <GridActionsCellItem
              key="delete"
              icon={<Delete />}
              label="Delete"
              onClick={handleDeleteClick(id)}
              color="inherit"
            />,
          ];
        },
      },
    ];
  }, [columns, rowModesModel, editedRows]);

  const getCellClassName = (params: GridCellParams) => {
    if (
      editedRows[params.id] &&
      editedRows[params.id][params.field] !== undefined
    ) {
      return "edited-cell";
    }
    return "";
  };

  return (
    <Box
      sx={{
        height: 650,
        width: "100%",
        "& .edited-cell": {
          backgroundColor: (theme) =>
            theme.palette.mode === "light"
              ? "rgba(255, 230, 180, 0.5)"
              : "rgba(255, 165, 0, 0.2)",
        },
      }}
    >
      <DataGrid
        apiRef={apiRef}
        rows={filteredData}
        columns={columnsDef}
        rowHeight={56}
        checkboxSelection
        disableRowSelectionOnClick
        rowSelectionModel={selection}
        onRowSelectionModelChange={(newSelectionModel) =>
          setSelection(newSelectionModel)
        }
        keepNonExistentRowsSelected
        slots={{ toolbar: ToolbarComponent }}
        slotProps={{
          toolbar: {
            selectedRows: selection,
            onClearSelection: () => setSelection([]),
            showToast: showToast,
            hasEdits: hasEdits,
          } as any,
        }}
        initialState={{
          pagination: { paginationModel: { page: 0, pageSize: 10 } },
        }}
        pageSizeOptions={[10, 20, 50]}
        editMode="cell"
        rowModesModel={rowModesModel}
        onRowModesModelChange={(newModel) => setRowModesModel(newModel)}
        onRowEditStop={handleRowEditStop}
        processRowUpdate={processRowUpdate}
        onProcessRowUpdateError={handleProcessRowUpdateError}
        onCellEditStop={handleCellEditStop}
        onCellEditStart={(params) => {
          if (rowModesModel[params.id]?.mode === GridRowModes.Edit) {
            setRowModesModel({
              ...rowModesModel,
              [params.id]: { mode: GridRowModes.View },
            });
          }
        }}
        processCellUpdate={(updatedCell: GridCellParams) => {
          dispatch(
            updateCellValue({
              rowId: updatedCell.id as string,
              columnId: updatedCell.field,
              value: updatedCell.value,
            })
          );
          return updatedCell;
        }}
        getCellClassName={getCellClassName}
      />
      <Dialog
        open={rowSaveConfirm.open}
        onClose={() => setRowSaveConfirm({ open: false, rowId: null })}
      >
        <DialogTitle>Confirm Save</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to save the changes for this row?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setRowSaveConfirm({ open: false, rowId: null })}
          >
            Cancel
          </Button>
          <Button onClick={confirmRowSave} color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={rowCancelConfirm.open}
        onClose={() => setRowCancelConfirm({ open: false, rowId: null })}
      >
        <DialogTitle>Confirm Cancel</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to discard the changes for this row?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setRowCancelConfirm({ open: false, rowId: null })}
          >
            Cancel
          </Button>
          <Button onClick={confirmRowCancel} color="error">
            Discard
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, rowId: null })}
      >
        <DialogTitle>Are you absolutely sure?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This action cannot be undone. This will permanently delete this row.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteConfirm({ open: false, rowId: null })}
          >
            Cancel
          </Button>
          <Button onClick={confirmDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast({ ...toast, open: false })}
      >
        <Alert
          onClose={() => setToast({ ...toast, open: false })}
          severity={toast.severity}
          sx={{ width: "100%" }}
          variant="filled"
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
