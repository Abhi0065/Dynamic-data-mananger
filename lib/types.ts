export type Person = {
  id: string;
  name: string;
  email: string;
  age: number;
  role: "Admin" | "User" | "Manager" | "Guest";
  department?: string;
  location?: string;
  [key: string]: any;
};

export type ColumnConfig = {
  id: string;
  label: string;
  visible: boolean;
};
