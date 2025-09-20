import React, { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Upload, FileText, ArrowRight, Check } from "lucide-react";
import Papa from "papaparse";
import { toast } from "@/lib/toast";
import { CRMEventsService } from "@/services/CRMEventsService";
import { useLoader } from "@/contexts/LoaderContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CSVUploadModalProps {
  open: boolean;
  onClose: () => void;
  onComplete: (result: any) => void;
}

interface ColumnMapping {
  name: string;
  date: string;
  crm_id: string;
}

export function CSVUploadModal({ open, onClose, onComplete }: CSVUploadModalProps) {
  const [step, setStep] = useState<"upload" | "mapping" | "preview">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({
    name: "",
    date: "",
    crm_id: "",
  });
  const [preview, setPreview] = useState<any[]>([]);
  const { showLoader, hideLoader } = useLoader();
  const service = new CRMEventsService();

  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Reset modal state whenever it opens to avoid stale file/mapping from previous import
  useEffect(() => {
    if (!open) return;
    setStep("upload");
    setFile(null);
    setCsvData([]);
    setCsvHeaders([]);
    setMapping({ name: "", date: "", crm_id: "" });
    setPreview([]);
    setDragActive(false);
    if (inputRef.current) inputRef.current.value = "";
  }, [open]);

  const handleFileSelect = (file: File) => {
    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv') && file.type !== "text/csv") {
      toast.error("Please upload a CSV file");
      return;
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setFile(file);
    parseCSV(file);
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // allow re-selecting the same filename by clearing the input value
    event.currentTarget.value = "";
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);

    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
  };

  const parseCSV = (file: File) => {
    Papa.parse(file, {
      complete: (result) => {
        if (result.data && result.data.length > 0) {
          // Filter out completely empty rows
          const rows = (result.data as any[]).filter((r) => r && Object.values(r).some((v) => String(v || "").trim() !== ""));
          const headers = rows.length > 0 ? Object.keys(rows[0] as any) : [];
          setCsvHeaders(headers);
          setCsvData(rows as any[]);
          autoDetectMapping(headers);
          setStep("mapping");
        }
      },
      header: true,
      skipEmptyLines: true,
    });
  };

  const autoDetectMapping = (headers: string[]) => {
    const newMapping: ColumnMapping = { name: "", date: "", crm_id: "" };

    // Auto-detect name column
    const namePatterns = ["name", "event_name", "title", "event"];
    for (const header of headers) {
      if (namePatterns.some(p => header.toLowerCase().includes(p))) {
        newMapping.name = header;
        break;
      }
    }

    // Auto-detect date column
    const datePatterns = ["date", "event_date", "start_date", "start"];
    for (const header of headers) {
      if (datePatterns.some(p => header.toLowerCase().includes(p))) {
        newMapping.date = header;
        break;
      }
    }

    // Auto-detect ID column
    const idPatterns = ["id", "uuid", "event_id", "crm_id", "event_uuid"];
    for (const header of headers) {
      if (idPatterns.some(p => header.toLowerCase().includes(p))) {
        newMapping.crm_id = header;
        break;
      }
    }

    setMapping(newMapping);
  };

  const handleMappingChange = (field: keyof ColumnMapping, value: string) => {
    // Convert __none__ back to empty string for internal state
    const mappedValue = value === "__none__" ? "" : value;
    setMapping(prev => ({ ...prev, [field]: mappedValue }));
  };

  const handleContinueToPreview = () => {
    if (!mapping.name || !mapping.date) {
      toast.error("Please map the required fields (Name and Date)");
      return;
    }

    // Generate preview with mapped data (defensive indexing)
    const previewData = csvData.slice(0, 5).map((row) => ({
      name: row?.[mapping.name] ?? "",
      date: row?.[mapping.date] ?? "",
      crm_id: mapping.crm_id ? row?.[mapping.crm_id] ?? "" : "",
    }));
    setPreview(previewData);
    setStep("preview");
  };

  const handleImport = async () => {
    if (!file) return;

    try {
      showLoader("Importing events...");
      const result = await service.uploadCSV(file, mapping);
      hideLoader();
      onComplete(result);
    } catch (error) {
      console.error("Error importing CSV:", error);
      toast.error("Failed to import CSV");
      hideLoader();
    }
  };

  const renderUploadStep = () => (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => {
          if (inputRef.current) inputRef.current.value = "";
          document.getElementById('csv-file-input')?.click();
        }}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          dragActive 
            ? "border-primary bg-primary/5" 
            : file 
              ? "border-green-400 bg-green-50" 
              : "border-muted-foreground/25 hover:border-primary hover:bg-primary/5"
        }`}
      >
        <input
          id="csv-file-input"
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileInputChange}
          className="hidden"
          ref={inputRef}
        />
        
        <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        {dragActive ? (
          <p className="text-lg font-medium">Drop the CSV file here...</p>
        ) : file ? (
          <div>
            <p className="text-lg font-medium text-green-700 mb-2">{file.name}</p>
            <p className="text-sm text-green-600">
              {(file.size / 1024).toFixed(1)} KB • Ready to process
            </p>
          </div>
        ) : (
          <>
            <p className="text-lg font-medium mb-2">
              Drag & drop your CSV file here
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              or click to browse
            </p>
            <Button variant="secondary" size="sm">
              Select File
            </Button>
          </>
        )}
      </div>
    </div>
  );

  const renderMappingStep = () => (
    <div className="space-y-4">
      <Alert>
        <AlertDescription>
          Map your CSV columns to the required fields. We've auto-detected some mappings for you.
        </AlertDescription>
      </Alert>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 items-center">
          <Label>Event Name</Label>
          <Select value={mapping.name || "__none__"} onValueChange={(v) => handleMappingChange("name", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select column" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Don't import</SelectItem>
              {csvHeaders.map(header => (
                <SelectItem key={header} value={header}>
                  {header}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4 items-center">
          <Label>Event Date</Label>
          <Select value={mapping.date || "__none__"} onValueChange={(v) => handleMappingChange("date", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select column" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Don't import</SelectItem>
              {csvHeaders.map(header => (
                <SelectItem key={header} value={header}>
                  {header}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4 items-center">
          <Label>Event ID (Optional)</Label>
          <Select value={mapping.crm_id || "__none__"} onValueChange={(v) => handleMappingChange("crm_id", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select column" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Don't import</SelectItem>
              {csvHeaders.map(header => (
                <SelectItem key={header} value={header}>
                  {header}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Preview first row */}
      {csvData.length > 0 && mapping.name && (
        <div className="p-3 bg-muted rounded-lg space-y-2">
          <p className="text-sm font-medium">Preview (first row):</p>
          <div className="text-sm space-y-1">
            {mapping.name && (
              <div>Name: {csvData[0][mapping.name]}</div>
            )}
            {mapping.date && (
              <div>Date: {csvData[0][mapping.date]}</div>
            )}
            {mapping.crm_id && (
              <div>Event ID: {csvData[0][mapping.crm_id]}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderPreviewStep = () => (
    <div className="space-y-4">
      <Alert>
        <AlertDescription>
          Review the first few rows to ensure mapping is correct.
        </AlertDescription>
      </Alert>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event Name</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Event ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {preview.map((row, index) => (
              <TableRow key={index}>
                <TableCell>{row.name}</TableCell>
                <TableCell>{row.date}</TableCell>
                <TableCell className="font-mono text-sm">{row.crm_id}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground">
        Showing first {preview.length} of {csvData.length} rows
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Events from CSV</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {/* Step indicator */}
          <div className="flex items-center justify-between mb-6">
            <div className={`flex items-center gap-2 ${step === "upload" ? "text-primary" : "text-muted-foreground"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                step === "upload" ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground"
              }`}>
                1
              </div>
              <span className="text-sm font-medium">Upload</span>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
            <div className={`flex items-center gap-2 ${step === "mapping" ? "text-primary" : "text-muted-foreground"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                step === "mapping" ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground"
              }`}>
                2
              </div>
              <span className="text-sm font-medium">Map Columns</span>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
            <div className={`flex items-center gap-2 ${step === "preview" ? "text-primary" : "text-muted-foreground"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                step === "preview" ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground"
              }`}>
                3
              </div>
              <span className="text-sm font-medium">Preview</span>
            </div>
          </div>

          {/* Step content */}
          {step === "upload" && renderUploadStep()}
          {step === "mapping" && renderMappingStep()}
          {step === "preview" && renderPreviewStep()}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {step === "mapping" && (
            <Button onClick={handleContinueToPreview}>
              Continue
            </Button>
          )}
          {step === "preview" && (
            <>
              <Button variant="outline" onClick={() => setStep("mapping")}>
                Back
              </Button>
              <Button onClick={handleImport}>
                <Check className="w-4 h-4 mr-2" />
                Import {csvData.length} Events
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}