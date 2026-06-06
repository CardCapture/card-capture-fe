import "@tanstack/react-table";
import type { RowData } from "@tanstack/react-table";

// Allow our card table columns to carry sticky-positioning + class hints
// via column `meta`, consumed in CardTable.tsx.
declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    stickyClass?: string;
    cellClass?: string;
    headClass?: string;
  }
}
