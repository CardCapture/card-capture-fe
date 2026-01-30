import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { logger } from '@/utils/logger';
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
  RotateCcw,
  FileSpreadsheet,
  QrCode,
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
import { useBulkActions } from "@/hooks/useBulkActions";
import { downloadCSV } from "@/utils/csvExport";
import { useCardTableActions } from "@/hooks/useCardTableActions";
import { useLoader, TableLoader } from "@/contexts/LoaderContext";
import { CardService } from "@/services/CardService";
import { useState, useEffect } from "react";
import { IntegrationsService } from "@/services/IntegrationsService";
import type { SchoolData } from "@/api/supabase/schools";
import { QRScannerModal } from "@/components/QRScannerModal";

// Add any additional imports as needed

interface CardTableProps {
  table: any;
  handleRowClick: any;
  selectedTab: any;
  filteredCards: any;
  paginatedCards: any;
  currentPage: any;
  totalPages: any;
  setCurrentPage: any;
  pageSize: any;
  setPageSize: any;
  getStatusCount: any;
  hideExported: any;
  setHideExported: any;
  searchQuery: any;
  setSearchQuery: any;
  debouncedSearch: any;
  isUploading: any;
  selectedEvent: any;
  dataFieldsMap: any;
  reviewFieldOrder: any;
  fileInputRef: any;
  handleFileSelect: any;
  handleCaptureCard: any;
  handleImportFile: any;
  handleManualEntry: any;
  handleSignupSheet: any;
  fetchCards: any;
  bulkSelection: any;
  isLoading?: boolean;
  school?: SchoolData | null; // Add school data for feature flags
}

const CardTable: React.FC<CardTableProps> = ({
  table,
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
  selectedEvent, // Add selectedEvent prop for the hook
  dataFieldsMap,
  reviewFieldOrder,
  fileInputRef,
  handleFileSelect,
  handleCaptureCard,
  handleImportFile,
  handleManualEntry,
  handleSignupSheet, // Add signup sheet handler
  fetchCards, // Add this prop for refreshing data
  bulkSelection, // Add bulkSelection as a prop
  isLoading = false, // Add isLoading prop for the loader
  school, // Add school data for feature flags
}) => {
  // Get loader context to check cards loading state
  const { isLoading: isGlobalLoading } = useLoader();
  const CARDS_LOADER_ID = `cards-${selectedEvent?.id || "default"}`;

  // Use the actual loading state from the cards hook
  const cardsLoading = isGlobalLoading(CARDS_LOADER_ID);

  // Use our new bulk actions hook
  const bulkActions = useBulkActions(fetchCards, bulkSelection.clearSelection);

  // Use the card table actions hook for export functionality
  const { handleExportToSlate } = useCardTableActions(
    filteredCards,
    fetchCards,
    toast,
    selectedEvent,
    dataFieldsMap
  );

  // Add retry functionality for AI failed cards
  const [isRetrying, setIsRetrying] = useState(false);

  // QR Scanner Modal state
  const [showQRScanner, setShowQRScanner] = useState(false);

  // Check if school has Slate integration enabled
  const [hasSlateIntegration, setHasSlateIntegration] = useState(false);
  
  // Check for SFTP/Slate integration on component mount
  useEffect(() => {
    const checkSlateIntegration = async () => {
      if (!selectedEvent?.school_id) {
        setHasSlateIntegration(false);
        return;
      }
      
      try {
        const sftpConfig = await IntegrationsService.getSftpConfig(selectedEvent.school_id);
        // Consider Slate configured if host and username are provided
        const isConfigured = sftpConfig && sftpConfig.host && sftpConfig.username;
        setHasSlateIntegration(!!isConfigured);
      } catch (error) {
        logger.log("No SFTP configuration found for school");
        setHasSlateIntegration(false);
      }
    };
    
    checkSlateIntegration();
  }, [selectedEvent?.school_id]);

  // Handle bulk AI retry
  const handleBulkRetryAI = async () => {
    if (bulkSelection.selectedCount === 0) {
      toast({
        title: "No Cards Selected",
        description: "Please select at least one card to retry AI processing.",
        variant: "destructive",
      });
      return;
    }

    setIsRetrying(true);
    try {
      // Retry AI processing for each selected card
      const retryPromises = bulkSelection.selectedIds.map(async (documentId) => {
        try {
          await CardService.retryAIProcessing(documentId);
          return { success: true, documentId };
        } catch (error) {
          return { success: false, documentId, error };
        }
      });

      const results = await Promise.all(retryPromises);
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.length - successCount;

      if (successCount > 0) {
        toast({
          title: "AI Retry Started",
          description: `${successCount} card(s) queued for AI processing retry.`,
          variant: "default",
        });
        // Refresh the cards list
        fetchCards();
        // Clear selection
        bulkSelection.clearSelection();
      }

      if (failureCount > 0) {
        toast({
          title: "Some Retries Failed",
          description: `${failureCount} card(s) could not be retried. Please try again.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Retry Failed",
        description: "Failed to retry AI processing. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRetrying(false);
    }
  };

  // Handle CSV export
  const handleExportClick = () => {
    if (bulkSelection.selectedCount === 0) {
      toast({
        title: "No Cards Selected",
        description: "Please select at least one card to export.",
        variant: "destructive",
      });
      return;
    }

    logger.log(`📊 Exporting ${bulkSelection.selectedCount} cards to CSV`);
    const eventName = selectedEvent?.name || "Unknown Event";
    downloadCSV(
      bulkSelection.selectedCards,
      `cards-export-${new Date().toISOString().split("T")[0]}.csv`,
      eventName,
      reviewFieldOrder, // Pass the dynamic field order
      dataFieldsMap, // Pass the field labels mapping
      selectedEvent?.slate_event_id // Pass the Slate Event ID
    );

    // Mark as exported via API
    bulkActions.exportCards(bulkSelection.selectedIds);
  };

  // Handle Slate export
  const handleExportToSlateClick = () => {
    if (bulkSelection.selectedCount === 0) {
      toast({
        title: "No Cards Selected",
        description: "Please select at least one card to export.",
        variant: "destructive",
      });
      return;
    }

    logger.log(`🎯 Exporting ${bulkSelection.selectedCount} cards to Slate`);
    handleExportToSlate(bulkSelection.selectedIds);
  };

  return (
    <div className="w-full">
      <div className="space-y-4">
        {/* Mobile-Responsive Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
          <div className="w-full sm:w-auto sm:flex-1 sm:max-w-sm">
            <Input
              type="search"
              placeholder="Search cards..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                debouncedSearch(e.target.value);
              }}
              className="w-full min-h-[44px]"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 hover:scale-[1.02] w-full sm:w-auto min-h-[44px]">
                <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Add Card</span>
                <ChevronDown className="w-4 h-4 ml-auto sm:ml-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-full sm:w-auto">
              <DropdownMenuItem onSelect={handleCaptureCard}>
                <Camera className="w-4 h-4 mr-2" />
                <span>Capture Card</span>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={handleImportFile}>
                <Upload className="w-4 h-4 mr-2" />
                <span>Import Card(s)</span>
              </DropdownMenuItem>
              {school?.enable_qr_scanning && (
                <DropdownMenuItem onSelect={() => setShowQRScanner(true)}>
                  <QrCode className="w-4 h-4 mr-2" />
                  <span>Scan QR Code</span>
                </DropdownMenuItem>
              )}
              {school?.enable_signup_sheets && (
                <DropdownMenuItem onSelect={handleSignupSheet}>
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  <span>Upload Sign-up Sheet</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onSelect={handleManualEntry}>
                <UserPlus className="w-4 h-4 mr-2" />
                <span>Enter Manually</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {selectedTab === "ready_to_export" && (
          <div
            className={`flex items-center gap-3 text-xs text-gray-500 ${
              bulkSelection.selectedCount > 0 ? "mb-4" : "mb-0"
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

        {/* Mobile-Responsive Selection Action Bar */}
        {bulkSelection.selectedCount > 0 ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg shadow-sm sticky top-0 z-10 transition-all duration-200 ease-in-out animate-in fade-in slide-in-from-top-2">
            <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center px-4 py-3 gap-3 sm:gap-0">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={bulkSelection.isAllSelected}
                  ref={(input) => {
                    if (input) {
                      input.indeterminate = bulkSelection.isSomeSelected;
                    }
                  }}
                  onChange={bulkSelection.toggleAll}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 transition-colors hover:border-primary-500 focus:ring-2 focus:ring-primary-600 focus:ring-offset-0"
                />
                <span className="text-sm font-semibold text-blue-800">
                  {bulkSelection.selectedCount}{" "}
                  {bulkSelection.selectedCount === 1 ? "Card" : "Cards"}{" "}
                  Selected
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                {selectedTab === "archived" ? (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        bulkActions.moveCards(
                          bulkSelection.selectedIds,
                          "reviewed"
                        )
                      }
                      disabled={bulkActions.isLoading}
                      className="text-gray-700 hover:text-gray-900 gap-1.5 flex-1 sm:flex-none min-h-[40px]"
                    >
                      {bulkActions.isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                      Move
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        bulkActions.deleteCards(bulkSelection.selectedIds)
                      }
                      disabled={bulkActions.isLoading}
                      className="text-red-600 hover:text-red-700 gap-1.5 flex-1 sm:flex-none min-h-[40px]"
                    >
                      {bulkActions.isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      Delete
                    </Button>
                  </>
                ) : selectedTab === "ai_failed" ? (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleBulkRetryAI}
                      disabled={isRetrying || bulkActions.isLoading}
                      className="text-amber-600 hover:text-amber-700 gap-1.5 flex-1 sm:flex-none min-h-[40px]"
                    >
                      {isRetrying ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RotateCcw className="h-4 w-4" />
                      )}
                      Retry AI
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        bulkActions.archiveCards(bulkSelection.selectedIds)
                      }
                      disabled={bulkActions.isLoading}
                      className="text-gray-700 hover:text-gray-900 gap-1.5 flex-1 sm:flex-none min-h-[40px]"
                    >
                      {bulkActions.isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Archive className="h-4 w-4" />
                      )}
                      Archive
                    </Button>
                  </>
                ) : (
                  <>
                    {/* Export button logic: single button if only CSV, dropdown if both */}
                    {hasSlateIntegration ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={bulkActions.isLoading}
                            className="text-gray-700 hover:text-gray-900 gap-1.5 flex-1 sm:flex-none min-h-[40px]"
                          >
                            {bulkActions.isLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                            Export
                            <ChevronDown className="h-3 w-3 ml-1" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem onSelect={handleExportClick}>
                            <Download className="w-4 h-4 mr-2" />
                            <span>Export to CSV</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={handleExportToSlateClick}>
                            <Upload className="w-4 h-4 mr-2" />
                            <span>Export to Slate</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleExportClick}
                        disabled={bulkActions.isLoading}
                        className="text-gray-700 hover:text-gray-900 gap-1.5 flex-1 sm:flex-none min-h-[40px]"
                      >
                        {bulkActions.isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                        Export
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        bulkActions.archiveCards(bulkSelection.selectedIds)
                      }
                      disabled={bulkActions.isLoading}
                      className="text-gray-700 hover:text-gray-900 gap-1.5 flex-1 sm:flex-none min-h-[40px]"
                    >
                      {bulkActions.isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Archive className="h-4 w-4" />
                      )}
                      Archive
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {/* Mobile-Responsive Table Container */}
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <div className="relative w-full overflow-x-auto">
            <Table
              className={`min-w-full ${
                bulkSelection.selectedCount > 0 ? "" : "mt-0"
              }`}
            >
              {bulkSelection.selectedCount === 0 && (
                <TableHeader className="bg-gray-50 sticky top-0 z-10">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead
                          key={header.id}
                          className={`py-3 px-2 sm:px-4 whitespace-nowrap text-xs sm:text-sm ${
                            header.column.getCanSort()
                              ? "cursor-pointer select-none"
                              : ""
                          }`}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <div className="flex items-center gap-1 font-medium text-gray-500">
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
                <TableLoader id={CARDS_LOADER_ID} rowCount={5} colCount={12} />
                {!cardsLoading && paginatedCards.length > 0
                  ? table.getRowModel().rows.map((tableRow) => (
                      <TableRow
                        key={tableRow.id}
                        data-state={
                          bulkSelection.isSelected(
                            tableRow.original.document_id
                          ) && "selected"
                        }
                        className="hover:bg-gray-100 cursor-pointer"
                        onClick={() => handleRowClick(tableRow.original)}
                      >
                        {tableRow.getVisibleCells().map((cell) => (
                          <TableCell
                            key={cell.id}
                            className="px-2 sm:px-4 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-700"
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  : !cardsLoading && (
                      <TableRow>
                        <TableCell colSpan={13} className="h-24">
                          <div className="flex flex-col items-center justify-center h-full gap-2 p-4">
                            {selectedTab === "needs_review" ? (
                              <>
                                <div className="text-sm font-medium text-gray-900 text-center">
                                  Nice work! No cards need review right now.
                                </div>
                                <div className="text-xs sm:text-sm text-gray-500 text-center">
                                  Upload more cards to get started.
                                </div>
                              </>
                            ) : selectedTab === "ready_to_export" ? (
                              <>
                                <div className="text-sm font-medium text-gray-900 text-center">
                                  No cards ready to export yet
                                </div>
                                <div className="text-xs sm:text-sm text-gray-500 text-center">
                                  Review cards first to prepare them for export.
                                </div>
                              </>
                            ) : selectedTab === "archived" ? (
                              <>
                                <div className="text-sm font-medium text-gray-900 text-center">
                                  No archived cards
                                </div>
                                <div className="text-xs sm:text-sm text-gray-500 text-center">
                                  Archived cards will appear here.
                                </div>
                              </>
                            ) : selectedTab === "ai_failed" ? (
                              <>
                                <div className="text-sm font-medium text-gray-900 text-center">
                                  No AI processing failures
                                </div>
                                <div className="text-xs sm:text-sm text-gray-500 text-center">
                                  Cards with AI processing failures will appear here.
                                </div>
                              </>
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Mobile-Responsive Pagination Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t px-4 sm:px-6 py-4">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <span>Rows per page:</span>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => setPageSize(Number(value))}
            >
              <SelectTrigger className="w-16 sm:w-20 h-8">
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

          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <span className="text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="min-h-[36px] px-3"
            >
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              className="min-h-[36px] px-3"
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* QR Scanner Modal */}
      {selectedEvent?.id && (
        <QRScannerModal
          isOpen={showQRScanner}
          onClose={() => setShowQRScanner(false)}
          eventId={selectedEvent.id}
          onSuccess={() => {
            fetchCards();
            setShowQRScanner(false);
          }}
        />
      )}
    </div>
  );
};

export default CardTable;
