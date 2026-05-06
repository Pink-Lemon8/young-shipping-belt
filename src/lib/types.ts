export type Result = {
  status: "success" | "error" | "warning" | "info";
  statusCode?: number;
  messages?: string[];
  errors?: Error[];
  value?: any;
};

export type Error = {
  code?: string;
  field?: string;
  message: string;
};
