import React, { memo, useMemo, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, PencilLine, Trash2, Check, X } from "lucide-react";
import { toast } from "@/lib/toast";

interface MajorsSectionProps {
  majorsList: string[];
  editedMajors: string[];
  setEditedMajors: (majors: string[]) => void;
  search: string;
  setSearch: (search: string) => void;
  showImport: boolean;
  setShowImport: (show: boolean) => void;
  isDirty: boolean;
  setIsDirty: (dirty: boolean) => void;
  editIndex: number | null;
  setEditIndex: (index: number | null) => void;
  editValue: string;
  setEditValue: (value: string) => void;
  addMajorsInput: string;
  setAddMajorsInput: (input: string) => void;
  saveMajors: () => Promise<void>;
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
  isDirty,
  setIsDirty,
  editIndex,
  setEditIndex,
  editValue,
  setEditValue,
  addMajorsInput,
  setAddMajorsInput,
  saveMajors,
  loadingMajors,
}) => {
  // Memoize filtered majors for performance
  const filteredMajors = useMemo(() => {
    return editedMajors.filter((m) =>
      m.toLowerCase().includes(search.toLowerCase())
    );
  }, [editedMajors, search]);

  // Memoize callbacks to prevent unnecessary re-renders
  const handleEditMajor = useCallback(
    (idx: number) => {
      if (editValue.trim() && editValue !== editedMajors[idx]) {
        const newMajors = [...editedMajors];
        newMajors[idx] = editValue.trim();
        setEditedMajors(newMajors);
        setIsDirty(true);
      }
      setEditIndex(null);
      setEditValue("");
    },
    [
      editValue,
      editedMajors,
      setEditedMajors,
      setIsDirty,
      setEditIndex,
      setEditValue,
    ]
  );

  const handleDeleteMajor = useCallback(
    (idx: number) => {
      const newMajors = editedMajors.filter((_, i) => i !== idx);
      setEditedMajors(newMajors);
      setIsDirty(true);
    },
    [editedMajors, setEditedMajors, setIsDirty]
  );

  const handleShowImport = useCallback(() => {
    setShowImport(true);
    setAddMajorsInput("");
  }, [setShowImport, setAddMajorsInput]);

  const handleAddMajors = useCallback(() => {
    // Parse and add new majors
    const newMajors = addMajorsInput
      .split("\n")
      .map((m) => m.trim())
      .filter((m) => m.length > 0 && !editedMajors.includes(m));

    if (newMajors.length > 0) {
      const updatedMajors = [...newMajors, ...editedMajors];
      setEditedMajors(updatedMajors);
      setIsDirty(true);
      toast.success(
        `${newMajors.length} major${newMajors.length > 1 ? "s" : ""} added`
      );
    }
    setShowImport(false);
    setAddMajorsInput("");
  }, [
    addMajorsInput,
    editedMajors,
    setEditedMajors,
    setIsDirty,
    setShowImport,
    setAddMajorsInput,
  ]);

  const handleCancelImport = useCallback(() => {
    setShowImport(false);
    setAddMajorsInput("");
  }, [setShowImport, setAddMajorsInput]);

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
          <div className="max-h-[500px] overflow-y-auto rounded-md border border-muted-foreground/10 bg-muted/50 divide-y divide-muted-foreground/10">
            {filteredMajors.map((major, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 px-3 py-2 group hover:bg-muted/80 transition"
              >
                {editIndex === idx ? (
                  <>
                    <Input
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleEditMajor(idx);
                        if (e.key === "Escape") {
                          setEditIndex(null);
                          setEditValue("");
                        }
                      }}
                      className="flex-1 border-none bg-transparent px-0 py-0 text-base font-normal focus:ring-0 focus-visible:ring-0 focus:outline-none shadow-none"
                    />
                    <button
                      className="text-green-600 hover:bg-green-100 rounded-full p-1"
                      onClick={() => handleEditMajor(idx)}
                      type="button"
                      aria-label="Save major"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      className="text-muted-foreground hover:bg-muted rounded-full p-1"
                      onClick={() => {
                        setEditIndex(null);
                        setEditValue("");
                      }}
                      type="button"
                      aria-label="Cancel edit major"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 truncate text-base font-normal">
                      {major}
                    </span>
                    <button
                      className="text-primary hover:bg-muted rounded-full p-1"
                      onClick={() => {
                        setEditIndex(idx);
                        setEditValue(major);
                      }}
                      type="button"
                      aria-label="Edit major"
                    >
                      <PencilLine className="w-4 h-4" />
                    </button>
                    <button
                      className="text-destructive hover:bg-destructive/10 rounded-full p-1"
                      onClick={() => handleDeleteMajor(idx)}
                      type="button"
                      aria-label="Delete major"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            ))}
            {filteredMajors.length === 0 && (
              <div className="text-xs text-muted-foreground px-3 py-4 text-center">
                No majors found.
              </div>
            )}
          </div>
          {/* Sticky Save Button */}
          {isDirty && (
            <div className="sticky bottom-0 left-0 w-full flex justify-end pt-4 bg-gradient-to-t from-white via-white/80 to-transparent z-10">
              <Button
                onClick={() => saveMajors()}
                className="shadow-md"
                variant="default"
              >
                Save Changes
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default memo(MajorsSection);
export { MajorsSection };
