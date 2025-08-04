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
import { Plus, Trash2, X, GripVertical, Edit, Check } from "lucide-react";
import { toast } from "@/lib/toast";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Sortable major row component
function SortableMajorRow({ 
  major, 
  index, 
  isSelected, 
  onToggleSelection,
  onEdit,
  onDelete,
  editIndex,
  editValue,
  setEditValue,
  onSaveEdit,
  onCancelEdit
}: {
  major: string;
  index: number;
  isSelected: boolean;
  onToggleSelection: (index: number) => void;
  onEdit: (index: number, value: string) => void;
  onDelete: (index: number) => void;
  editIndex: number | null;
  editValue: string;
  setEditValue: (value: string) => void;
  onSaveEdit: (index: number) => void;
  onCancelEdit: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: `major-${index}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isEditing = editIndex === index;

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={`group hover:bg-gray-50 ${isSelected ? "bg-blue-50" : ""}`}
    >
      <TableCell>
        <div className="flex justify-center">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelection(index)}
            onClick={(e) => e.stopPropagation()}
            className="h-4 w-4 rounded border-gray-300 text-primary-600 transition-colors hover:border-primary-500 focus:ring-2 focus:ring-primary-600 focus:ring-offset-0"
          />
        </div>
      </TableCell>
      
      <TableCell>
        <div className="flex items-center gap-2">
          <button
            className="touch-none cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4 text-gray-400" />
          </button>
          
          {isEditing ? (
            <div className="flex items-center gap-1 min-w-0 flex-1">
              <Input
                autoFocus
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    onSaveEdit(index);
                  }
                  if (e.key === "Escape") {
                    onCancelEdit();
                  }
                }}
                onBlur={() => {
                  if (editValue.trim() && editValue !== major) {
                    onSaveEdit(index);
                  } else {
                    onCancelEdit();
                  }
                }}
                className="border border-blue-200 bg-blue-50 px-2 py-1 text-base font-normal focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-md h-8"
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onSaveEdit(index)}
                className="h-8 w-8 p-0"
              >
                <Check className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onCancelEdit}
                className="h-8 w-8 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="font-medium">{major}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onEdit(index, major)}
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Edit className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </TableCell>
      
      <TableCell>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(index);
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 hover:bg-red-50 p-1 h-auto"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

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
  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );
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

  // Handle drag end for reordering
  const handleDragEnd = useCallback((event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = parseInt(active.id.replace('major-', ''));
      const newIndex = parseInt(over.id.replace('major-', ''));
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newMajors = arrayMove(filteredMajors, oldIndex, newIndex);
        setEditedMajors(newMajors);
      }
    }
  }, [filteredMajors, setEditedMajors]);

  // Handle edit functions
  const handleEditMajor = useCallback(async (index: number) => {
    if (editValue.trim() && editValue !== filteredMajors[index]) {
      const newMajors = [...editedMajors];
      const majorIndex = newMajors.findIndex(m => m === filteredMajors[index]);
      if (majorIndex !== -1) {
        newMajors[majorIndex] = editValue.trim();
        setEditedMajors(newMajors);
        
        // Auto-save the changes
        try {
          await saveMajors(newMajors);
          toast.success("Major updated and saved");
        } catch (error) {
          // If save fails, revert the local state
          setEditedMajors(editedMajors);
          toast.error("Failed to save changes");
        }
      }
    }
    setEditIndex(null);
    setEditValue("");
  }, [editValue, filteredMajors, editedMajors, setEditedMajors, setEditIndex, setEditValue, saveMajors]);

  const handleCancelEdit = useCallback(() => {
    setEditIndex(null);
    setEditValue("");
  }, [setEditIndex, setEditValue]);

  const handleStartEdit = useCallback((index: number, value: string) => {
    setEditIndex(index);
    setEditValue(value);
  }, [setEditIndex, setEditValue]);

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

          {/* Table with Drag and Drop */}
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
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext 
                    items={filteredMajors.map((_, idx) => `major-${idx}`)} 
                    strategy={verticalListSortingStrategy}
                  >
                    {filteredMajors.map((major, idx) => (
                      <SortableMajorRow
                        key={`major-${idx}`}
                        major={major}
                        index={idx}
                        isSelected={isSelected(idx)}
                        onToggleSelection={toggleSelection}
                        onEdit={handleStartEdit}
                        onDelete={handleDeleteMajor}
                        editIndex={editIndex}
                        editValue={editValue}
                        setEditValue={setEditValue}
                        onSaveEdit={handleEditMajor}
                        onCancelEdit={handleCancelEdit}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
                {filteredMajors.length === 0 && (
                   <TableRow>
                     <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
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
