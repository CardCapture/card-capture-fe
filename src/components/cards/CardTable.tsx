import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Download,
  Archive,
  Trash2,
  CheckCircle,
  PlusCircle,
  Camera,
  Upload,
  UserPlus,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { flexRender } from "@tanstack/react-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";

// Add any additional imports as needed

const CardTable = ({
  table,
  rowSelection,
  handleRowClick,
  selectedTab,
  filteredCards,
  paginatedCards,
  currentPage,
  totalPages,
  setCurrentPage,
  pageSize,
  setPageSize,
  getStatusCount,
  hideExported,
  setHideExported,
  searchQuery,
  setSearchQuery,
  debouncedSearch,
  isUploading,
  handleExportSelected,
  handleArchiveSelected,
  handleMoveSelected,
  handleDeleteSelected,
  setIsArchiveConfirmOpen,
  setIsMoveConfirmOpen,
  setIsDeleteConfirmOpen,
  dataFieldsMap,
  reviewFieldOrder,
  fileInputRef,
  handleFileSelect,
  handleCaptureCard,
  handleImportFile,
  handleManualEntry,
  handleExportToSlate,
}) => {
  // Debug pagination and filtering
  console.log('CardTable debug:', {
    filteredCards,
    paginatedCards,
    currentPage,
    pageSize,
    paginatedCardsLength: paginatedCards.length,
    filteredCardsLength: filteredCards.length
  });
  // Render the table and toolbar as in the current file
  // ...
  const handleArchiveClick = () => {
    const selectedIds = Object.keys(rowSelection).filter(id => rowSelection[id]);
    if (selectedIds.length === 0) {
      toast({
        title: "No Cards Selected",
        description: "Please select at least one card to archive.",
        variant: "destructive",
      });
      return;
    }
    setIsArchiveConfirmOpen(true);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="px-6 py-5">
        <div className="flex flex-row justify-between items-center gap-6">
          <div className="w-full md:w-auto md:flex-1 max-w-sm">
            <Input
              type="search"
              placeholder="Search cards..."
              value={searchQuery}
              onChange={(e) => {
                const newValue = e.target.value;
                setSearchQuery(newValue);
                debouncedSearch(newValue);
              }}
              className="w-full"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 hover:scale-[1.02]">
                <PlusCircle className="w-5 h-5" />
                Add Card
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onSelect={handleCaptureCard}>
                <Camera className="w-4 h-4 mr-2" />
                <span>Capture Card</span>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={handleImportFile}>
                <Upload className="w-4 h-4 mr-2" />
                <span>Import Card(s)</span>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={handleManualEntry}>
                <UserPlus className="w-4 h-4 mr-2" />
                <span>Enter Manually</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {selectedTab === "ready_to_export" && (
          <div
            className={`flex items-center gap-3 text-xs text-gray-500 mt-4 ${
              Object.keys(rowSelection).length > 0 ? "mb-4" : "mb-0"
            }`}
          >
            <Switch
              id="hide-exported"
              checked={hideExported}
              onCheckedChange={setHideExported}
              className="h-3 w-7 rounded-full bg-gray-200 ring-1 ring-gray-300 data-[state=checked]:bg-blue-500 data-[state=checked]:ring-blue-500 transition-colors"
            />
            <Label
              htmlFor="hide-exported"
              className="text-xs text-gray-500 ml-2"
            >
              Hide Exported
            </Label>
          </div>
        )}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept=".pdf,image/*"
          className="hidden"
        />
        {Object.keys(rowSelection).length > 0 ? (
          <div className="bg-blue-50 border-b border-blue-200 shadow-sm sticky top-0 z-10 transition-all duration-200 ease-in-out animate-in fade-in slide-in-from-top-2 mb-0">
            <div className="w-full flex justify-between items-center px-4 py-2.5">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={table.getIsAllRowsSelected()}
                  ref={(input) => {
                    if (input) {
                      input.indeterminate = table.getIsSomeRowsSelected();
                    }
                  }}
                  onChange={table.getToggleAllRowsSelectedHandler()}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 transition-colors hover:border-primary-500 focus:ring-2 focus:ring-primary-600 focus:ring-offset-0"
                />
                <span className="text-sm font-semibold text-blue-800">
                  {Object.keys(rowSelection).length}{" "}
                  {Object.keys(rowSelection).length === 1 ? "Card" : "Cards"}{" "}
                  Selected
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {selectedTab === "archived" ? (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const selectedIds = Object.keys(rowSelection).filter(id => rowSelection[id]);
                        handleMoveSelected(selectedIds);
                      }}
                      className="text-gray-700 hover:text-gray-900 gap-1.5"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Move
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const selectedIds = Object.keys(rowSelection).filter(id => rowSelection[id]);
                        handleDeleteSelected(selectedIds);
                      }}
                      className="text-red-600 hover:text-red-700 gap-1.5"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </>
                ) : (
                  <>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-700 hover:text-gray-900 gap-1.5 flex items-center"
                          disabled={isUploading}
                          type="button"
                          aria-label="Export options"
                          onClick={handleExportSelected}
                        >
                          {isUploading ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Exporting...
                            </>
                          ) : (
                            <>
                              <Download className="h-4 w-4" />
                              Export
                              <ChevronDown className="ml-1 h-4 w-4" />
                            </>
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem onSelect={handleExportSelected}>
                          Export as CSV
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={handleExportToSlate}>
                          Export to Slate
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleArchiveClick}
                      className="text-gray-700 hover:text-gray-900 gap-1.5"
                    >
                      <Archive className="h-4 w-4" />
                      Archive
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : null}
        {/* Table */}
        <Table className={Object.keys(rowSelection).length > 0 ? "" : "mt-4"}>
          {Object.keys(rowSelection).length === 0 && (
            <TableHeader className="bg-gray-50 sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className={`py-3 px-4 whitespace-nowrap ${
                        header.column.getCanSort()
                          ? "cursor-pointer select-none"
                          : ""
                      }`}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-1 text-xs font-medium text-gray-500">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {{ asc: " ▲", desc: " ▼" }[
                          header.column.getIsSorted() as string
                        ] ?? ""}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
          )}
          <TableBody>
            {paginatedCards.length > 0 ? (
              paginatedCards.map((row) => {
                // Find the row in table.getRowModel().rows by id
                const tableRow = table
                  .getRowModel()
                  .rows.find((r) => r.id === row.id);
                if (!tableRow) return null;
                return (
                  <TableRow
                    key={tableRow.id}
                    data-state={tableRow.getIsSelected() && "selected"}
                    className="hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleRowClick(tableRow.original)}
                  >
                    {tableRow.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className="px-4 py-3 whitespace-nowrap text-sm text-gray-700"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={13} className="h-24">
                  <div className="flex flex-col items-center justify-center h-full gap-2">
                    {selectedTab === "needs_human_review" ? (
                      <>
                        <div className="text-sm font-medium text-gray-900">
                          Nice work! No cards need review right now.
                        </div>
                        <div className="text-sm text-gray-500">
                          Upload more cards to get started.
                        </div>
                      </>
                    ) : selectedTab === "ready_to_export" ? (
                      <>
                        <div className="text-sm font-medium text-gray-900">
                          No cards ready to export yet
                        </div>
                        <div className="text-sm text-gray-500">
                          Review cards first to prepare them for export.
                        </div>
                      </>
                    ) : selectedTab === "archived" ? (
                      <>
                        <div className="text-sm font-medium text-gray-900">
                          No archived cards
                        </div>
                        <div className="text-sm text-gray-500">
                          Archived cards will appear here.
                        </div>
                      </>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {/* Pagination Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t px-6 py-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Rows per page:</span>
            <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
              <SelectTrigger className="w-20 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="75">75</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Page {currentPage} of {totalPages}</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Prev
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardTable;
