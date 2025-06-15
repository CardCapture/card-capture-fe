import React, { memo, useMemo, useCallback, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, X } from "lucide-react";
import { toast } from "@/lib/toast";

interface MajorsSectionProps {
  majorsList: string[];
  editedMajors: string[];
  setEditedMajors: (majors: string[]) => void;
  search: string;
  setSearch: (search: string) => void;
  showImport: boolean;
  setShowImport: (show: boolean) => void;
  editIndex: number | null;
  setEditIndex: (index: number | null) => void;
  editValue: string;
  setEditValue: (value: string) => void;
  addMajorsInput: string;
  setAddMajorsInput: (input: string) => void;
  saveMajors: (majorsOverride?: string[]) => Promise<void>;
  loadingMajors: boolean;
}

const MajorsSection: React.FC<MajorsSectionProps> = ({
  majorsList,
  editedMajors,
  setEditedMajors,
  search,
  setSearch,
  showImport,
  setShowImport,
  editIndex,
  setEditIndex,
  editValue,
  setEditValue,
  addMajorsInput,
  setAddMajorsInput,
  saveMajors,
  loadingMajors,
}) => {
  // Bulk selection state
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

  // Memoize filtered majors for performance
  const filteredMajors = useMemo(() => {
    return editedMajors.filter((m) =>
      m.toLowerCase().includes(search.toLowerCase())
    );
  }, [editedMajors, search]);

  // Bulk selection functions
  const isSelected = (index: number) => selectedIndices.has(index);
  const isAllSelected = filteredMajors.length > 0 && filteredMajors.every((_, idx) => selectedIndices.has(idx));
  const isSomeSelected = selectedIndices.size > 0 && selectedIndices.size < filteredMajors.length;

  const toggleSelection = useCallback((index: number) => {
    setSelectedIndices(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    if (isAllSelected) {
      setSelectedIndices(new Set()); // Clear all
    } else {
      setSelectedIndices(new Set(filteredMajors.map((_, idx) => idx))); // Select all
    }
  }, [filteredMajors, isAllSelected]);

  const clearSelection = useCallback(() => {
    setSelectedIndices(new Set());
  }, []);

  // Bulk actions
  const handleBulkDelete = useCallback(async () => {
    const selectedMajorsSet = new Set();
    selectedIndices.forEach(idx => {
      if (idx < filteredMajors.length) {
        selectedMajorsSet.add(filteredMajors[idx]);
      }
    });
    
    const newMajors = editedMajors.filter(major => !selectedMajorsSet.has(major));
    setEditedMajors(newMajors);
    clearSelection();
    
    // Auto-save the changes immediately
    try {
      await saveMajors(newMajors);
      toast.success(`${selectedIndices.size} major${selectedIndices.size > 1 ? "s" : ""} deleted and saved`);
    } catch (error) {
      // If save fails, revert the local state
      setEditedMajors(editedMajors);
      toast.error("Failed to save changes");
    }
  }, [selectedIndices, filteredMajors, editedMajors, setEditedMajors, clearSelection, saveMajors]);

  // Individual row callbacks
  const handleEditMajor = useCallback(
    async (idx: number) => {
      if (editValue.trim() && editValue !== editedMajors[idx]) {
        const newMajors = [...editedMajors];
        newMajors[idx] = editValue.trim();
        setEditedMajors(newMajors);
        
        // Auto-save the changes immediately
        try {
          await saveMajors(newMajors);
          toast.success("Major updated and saved");
        } catch (error) {
          // If save fails, revert the local state
          setEditedMajors(editedMajors);
          toast.error("Failed to save changes");
        }
      }
      setEditIndex(null);
      setEditValue("");
    },
    [
      editValue,
      editedMajors,
      setEditedMajors,
      setEditIndex,
      setEditValue,
      saveMajors,
    ]
  );

  const handleDeleteMajor = useCallback(
    async (idx: number) => {
      const newMajors = editedMajors.filter((_, i) => i !== idx);
      setEditedMajors(newMajors);
      
      // Auto-save the changes immediately
      try {
        await saveMajors(newMajors);
        toast.success("Major deleted and saved");
      } catch (error) {
        // If save fails, revert the local state
        setEditedMajors(editedMajors);
        toast.error("Failed to save changes");
      }
    },
    [editedMajors, setEditedMajors, saveMajors]
  );

  const handleShowImport = useCallback(() => {
    setShowImport(true);
    setAddMajorsInput("");
  }, [setShowImport, setAddMajorsInput]);

  const handleAddMajors = useCallback(async () => {
    // Parse and add new majors
    const newMajors = addMajorsInput
      .split("\n")
      .map((m) => m.trim())
      .filter((m) => m.length > 0 && !editedMajors.includes(m));

    if (newMajors.length > 0) {
      const updatedMajors = [...newMajors, ...editedMajors];
      setEditedMajors(updatedMajors);
      
      // Auto-save the majors immediately
      try {
        await saveMajors(updatedMajors);
        toast.success(
          `${newMajors.length} major${newMajors.length > 1 ? "s" : ""} added and saved`
        );
      } catch (error) {
        // If save fails, revert the local state
        setEditedMajors(editedMajors);
        toast.error("Failed to save majors");
        return;
      }
    }
    setShowImport(false);
    setAddMajorsInput("");
  }, [
    addMajorsInput,
    editedMajors,
    setEditedMajors,
    setShowImport,
    setAddMajorsInput,
    saveMajors,
  ]);

  const handleCancelImport = useCallback(() => {
    setShowImport(false);
    setAddMajorsInput("");
  }, [setShowImport, setAddMajorsInput]);

  // Selection action bar component
  const SelectionActionBar = () => {
    const selectedCount = selectedIndices.size;
    if (selectedCount === 0) return null;
    
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg shadow-sm sticky top-0 z-10 transition-all duration-200 ease-in-out animate-in fade-in slide-in-from-top-2 mb-4">
        <div className="px-4 py-3 flex justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isAllSelected}
              ref={(input) => {
                if (input) {
                  input.indeterminate = isSomeSelected;
                }
              }}
              onChange={toggleAll}
              className="h-4 w-4 rounded border-gray-300 text-primary-600 transition-colors hover:border-primary-500 focus:ring-2 focus:ring-primary-600 focus:ring-offset-0"
            />
            <span className="text-sm font-medium text-foreground">
              {selectedCount} {selectedCount === 1 ? "Major" : "Majors"} Selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBulkDelete}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="mr-1 h-4 w-4" />
              Delete Selected
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSelection}
              className="text-gray-500 hover:text-gray-700 px-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  if (loadingMajors) {
    return (
      <Card className="shadow-sm rounded-xl">
        <CardContent className="p-6">
          <div className="text-center py-8 text-muted-foreground">
            Loading majors...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Import Majors Card - conditionally shown */}
      {showImport && (
        <Card className="shadow-sm rounded-xl border-2 border-primary/20">
          <CardHeader>
            <CardTitle>Add Majors in Bulk</CardTitle>
            <CardDescription>
              Paste in one or more majors (one per line) to add to your list.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Label htmlFor="add-majors-input" className="text-sm font-medium">
              Majors (one per line)
            </Label>
            <Textarea
              id="add-majors-input"
              value={addMajorsInput}
              onChange={(e) => setAddMajorsInput(e.target.value)}
              placeholder={`Biology\nComputer Science\nBusiness Administration\nMechanical Engineering`}
              className="min-h-[200px]"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleAddMajors}
                disabled={!addMajorsInput.trim()}
              >
                Save Majors
              </Button>
              <Button variant="outline" onClick={handleCancelImport}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Majors Management Card */}
      <Card className="shadow-sm rounded-xl">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Manage Majors</CardTitle>
          <button
            className="text-primary hover:bg-muted rounded-full p-1 transition"
            onClick={handleShowImport}
            aria-label="Add major"
            type="button"
          >
            <Plus className="w-5 h-5" />
          </button>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search majors..."
            className="mb-2"
          />
          
          {/* Selection Action Bar */}
          <SelectionActionBar />

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <div className="flex justify-center">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        ref={(input) => {
                          if (input) {
                            input.indeterminate = isSomeSelected;
                          }
                        }}
                        onChange={toggleAll}
                        className="h-4 w-4 rounded border-gray-300 text-primary-600 transition-colors hover:border-primary-500 focus:ring-2 focus:ring-primary-600 focus:ring-offset-0"
                      />
                    </div>
                  </TableHead>
                  <TableHead>Major</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMajors.map((major, idx) => (
                  <TableRow
                    key={idx}
                    className={`group hover:bg-gray-50 ${
                      isSelected(idx) ? "bg-blue-50" : ""
                    }`}
                  >
                    <TableCell>
                      <div className="flex justify-center">
                        <input
                          type="checkbox"
                          checked={isSelected(idx)}
                          onChange={() => toggleSelection(idx)}
                          onClick={(e) => e.stopPropagation()}
                          className="h-4 w-4 rounded border-gray-300 text-primary-600 transition-colors hover:border-primary-500 focus:ring-2 focus:ring-primary-600 focus:ring-offset-0"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      {editIndex === idx ? (
                        <Input
                          autoFocus
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleEditMajor(idx);
                            }
                            if (e.key === "Escape") {
                              setEditIndex(null);
                              setEditValue("");
                            }
                          }}
                          onBlur={() => {
                            if (editValue.trim() && editValue !== major) {
                              handleEditMajor(idx);
                            } else {
                              setEditIndex(null);
                              setEditValue("");
                            }
                          }}
                          className="border border-blue-200 bg-blue-50 px-2 py-1 text-base font-normal focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-md"
                        />
                      ) : (
                        <div className="flex items-center">
                          <span 
                            className="text-base font-normal cursor-pointer hover:bg-gray-50 px-2 py-1 rounded-md transition-colors"
                            onDoubleClick={() => {
                              setEditIndex(idx);
                              setEditValue(major);
                            }}
                            title="Double-click to edit"
                          >
                            {major}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMajor(idx);
                            }}
                            className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded transition-all ml-2"
                            title="Delete major"
                            type="button"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                                 {filteredMajors.length === 0 && (
                   <TableRow>
                     <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                       No majors found.
                     </TableCell>
                   </TableRow>
                 )}
              </TableBody>
            </Table>
          </div>
          

        </CardContent>
      </Card>
    </div>
  );
};

export default memo(MajorsSection);
export { MajorsSection };
