export type ImportRowError = {
  row: number;
  message: string;
};

export type ImportResult = {
  imported: number;
  errors: ImportRowError[];
};
