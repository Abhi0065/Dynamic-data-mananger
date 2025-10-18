"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  List,
  ListItem,
  ListItemText,
  LinearProgress,
} from "@mui/material";
import { CloudUpload } from "@mui/icons-material";
import Papa from "papaparse";
import { useDispatch, useSelector } from "react-redux";
import { setData } from "@/lib/tableSlice";
import { Person } from "@/lib/types";
import { AppDispatch, RootState } from "@/lib/store/store";

export function ImportCSVDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const dispatch = useDispatch<AppDispatch>();
  const uploadInputRef = useRef<HTMLInputElement>(null);

  // Get current columns from Redux state
  const columns = useSelector((state: RootState) => state.table.columns);

  const [errors, setErrors] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setIsProcessing(true);
    setErrors([]);
    setMessage(null);

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: (results) => {
        try {
          const newRows: Person[] = [];
          const validationProblems: string[] = [];

          // Ensure columns is an array
          const columnsArray = Array.isArray(columns) ? columns : [];

          results.data.forEach((row: any, index: number) => {
            try {
              // Handle flexible column names (case-insensitive)
              const name = row.Name || row.name || "";
              const email = row.Email || row.email || "";
              const age = row.Age || row.age || "";
              const role = row.Role || row.role || "";

              if (!name || !email || !age || !role) {
                validationProblems.push(
                  `Row ${
                    index + 1
                  }: Missing required fields (Name, Email, Age, Role)`
                );
                return;
              }

              const ageValue = Number(age);
              if (isNaN(ageValue) || ageValue < 0 || ageValue > 150) {
                validationProblems.push(
                  `Row ${index + 1}: Invalid age value "${age}"`
                );
                return;
              }

              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (!emailRegex.test(email)) {
                validationProblems.push(
                  `Row ${index + 1}: Invalid email format "${email}"`
                );
                return;
              }

              const validRoles = ["Admin", "User", "Guest", "Manager"];
              if (!validRoles.includes(role)) {
                validationProblems.push(
                  `Row ${
                    index + 1
                  }: Invalid role "${role}". Must be one of: ${validRoles.join(
                    ", "
                  )}`
                );
                return;
              }

              const newRowData: Person = {
                id: `imported-${Date.now()}-${index}`,
                name: name.trim(),
                email: email.trim(),
                age: ageValue,
                role: role as "Admin" | "User" | "Guest" | "Manager",
              };

              // Add additional columns from CSV that aren't default fields
              Object.keys(row).forEach((columnName) => {
                const normalizedColumn = columnName.toLowerCase();
                const isDefaultField = [
                  "name",
                  "email",
                  "age",
                  "role",
                  "id",
                ].includes(normalizedColumn);

                if (!isDefaultField && row[columnName]) {
                  // Add the column value to the row data
                  newRowData[columnName] = row[columnName];
                }
              });

              newRows.push(newRowData);
            } catch (err: any) {
              validationProblems.push(`Row ${index + 1}: ${err.message}`);
            }
          });

          if (validationProblems.length > 0) {
            setErrors(validationProblems);
          }

          if (newRows.length > 0) {
            dispatch(setData(newRows));
            setMessage(`Successfully imported ${newRows.length} row(s)`);

            if (validationProblems.length === 0) {
              setTimeout(() => {
                onClose();
                // Reset state after closing
                setErrors([]);
                setMessage(null);
              }, 2000);
            }
          } else if (validationProblems.length === 0) {
            setErrors(["No valid data found in CSV file"]);
          }
        } catch (err: any) {
          console.error("CSV parsing error:", err);
          setErrors([`Failed to parse CSV: ${err.message}`]);
        } finally {
          setIsProcessing(false);
        }
      },
      error: (err) => {
        console.error("File read error:", err);
        setErrors([`Failed to read file: ${err.message}`]);
        setIsProcessing(false);
      },
    });

    // Reset file input
    if (uploadInputRef.current) {
      uploadInputRef.current.value = "";
    }
  };

  const handleUploadClick = () => {
    uploadInputRef.current?.click();
  };

  const handleClose = () => {
    setErrors([]);
    setMessage(null);
    setIsProcessing(false);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      data-testid="dialog-import-csv"
    >
      <DialogTitle>Import CSV</DialogTitle>
      <DialogContent>
        <Box
          sx={{
            border: "2px dashed",
            borderColor: "divider",
            borderRadius: 2,
            p: 4,
            textAlign: "center",
            bgcolor: "background.default",
            mb: 2,
          }}
        >
          <CloudUpload sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
          <Typography variant="body1" gutterBottom>
            Upload a CSV file to import data
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Required columns: Name, Email, Age, Role
          </Typography>
          <input
            ref={uploadInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            style={{ display: "none" }}
            data-testid="input-file-csv"
          />
          <Button
            variant="contained"
            onClick={handleUploadClick}
            disabled={isProcessing}
            data-testid="button-select-csv"
          >
            Select CSV File
          </Button>
        </Box>

        {isProcessing && <LinearProgress sx={{ mb: 2 }} />}

        {message && (
          <Alert
            severity="success"
            sx={{ mb: 2 }}
            data-testid="alert-import-success"
          >
            {message}
          </Alert>
        )}

        {errors.length > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Import Errors:
            </Typography>
            <List dense sx={{ maxHeight: 200, overflow: "auto" }}>
              {errors.map((error, index) => (
                <ListItem key={index} sx={{ py: 0 }}>
                  <ListItemText
                    primary={error}
                    primaryTypographyProps={{ variant: "body2" }}
                  />
                </ListItem>
              ))}
            </List>
          </Alert>
        )}

        <Typography variant="caption" color="text.secondary">
          <strong>CSV Format Example:</strong>
          <br />
          Name,Email,Age,Role
          <br />
          Priya Sharma,priya.sharma@techcorp.in,27,Developer
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} data-testid="button-close-import">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
