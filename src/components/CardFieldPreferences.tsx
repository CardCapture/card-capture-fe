import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus, GripVertical, Edit, X, Check } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { SchoolService, type CardField } from "@/services/SchoolService";

interface CardFieldPreferencesProps {
  fields: CardField[];
  onFieldsChange: (fields: CardField[]) => void;
}

// Enhanced row component with editing capabilities
function SortableRow({ field, onFieldUpdate, onFieldDelete }: {
  field: CardField;
  onFieldUpdate: (updatedField: CardField) => void;
  onFieldDelete: (key: string) => void;
}) {
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [labelInput, setLabelInput] = useState(field.label);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: field.key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleLabelSave = () => {
    onFieldUpdate({
      ...field,
      label: labelInput || SchoolService.generateDefaultLabel(field.key),
    });
    setIsEditingLabel(false);
  };

  const handleFieldTypeChange = (newType: CardField['field_type']) => {
    const updatedField = { ...field, field_type: newType };
    
    // Clear options if switching away from select type
    if (newType !== 'select' && newType !== 'checkbox') {
      updatedField.options = undefined;
    }
    
    onFieldUpdate(updatedField);
  };

  const updateVisible = (visible: boolean) => {
    onFieldUpdate({
      ...field,
      visible,
      required: visible ? field.required : false
    });
  };

  const updateRequired = (required: boolean) => {
    onFieldUpdate({ ...field, required });
  };

  return (
    <TableRow ref={setNodeRef} style={style} className="group">
      <TableCell>
        <div className="flex items-center gap-2">
          <button
            className="touch-none cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4 text-gray-400" />
          </button>
          {isEditingLabel ? (
            <div className="flex items-center gap-1 min-w-0 flex-1">
              <Input
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                className="h-8 min-w-[120px]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleLabelSave();
                  if (e.key === 'Escape') {
                    setLabelInput(field.label);
                    setIsEditingLabel(false);
                  }
                }}
                autoFocus
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={handleLabelSave}
                className="h-8 w-8 p-0"
              >
                <Check className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setLabelInput(field.label);
                  setIsEditingLabel(false);
                }}
                className="h-8 w-8 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="font-medium">{field.label}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditingLabel(true)}
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Edit className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </TableCell>
      
      <TableCell>
        <Select
          value={field.field_type || 'text'}
          onValueChange={handleFieldTypeChange}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text">Text</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="phone">Phone</SelectItem>
            <SelectItem value="date">Date</SelectItem>
            <SelectItem value="select">Select</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>

      <TableCell>
        <Switch
          checked={field.visible}
          onCheckedChange={updateVisible}
        />
      </TableCell>
      
      <TableCell>
        <Switch
          checked={field.required}
          onCheckedChange={updateRequired}
          disabled={!field.visible}
        />
      </TableCell>
      
      <TableCell>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onFieldDelete(field.key)}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 hover:bg-red-50 p-1 h-auto"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

export function CardFieldPreferences({ fields, onFieldsChange }: CardFieldPreferencesProps) {
  console.log('[CardFieldPreferences] fields:', fields);

  const updateField = (key: string, updatedField: CardField) => {
    onFieldsChange(fields.map(field => 
      field.key === key ? updatedField : field
    ));
  };

  const deleteField = (key: string) => {
    onFieldsChange(fields.filter(field => field.key !== key));
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = fields.findIndex(f => f.key === active.id);
      const newIndex = fields.findIndex(f => f.key === over.id);
      const newFields = arrayMove(fields, oldIndex, newIndex);
      onFieldsChange(newFields);
    }
  };

  if (fields.length === 0) {
    return (
      <div className="text-center py-8 space-y-3">
        <div className="text-gray-500 text-sm">
          No fields configured yet.
        </div>
        <div className="text-gray-400 text-xs">
          Fields will be automatically detected when you scan your first card.
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Field Name</TableHead>
              <TableHead className="w-32">Type</TableHead>
              <TableHead className="w-20">Visible</TableHead>
              <TableHead className="w-20">Required</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={fields.map(f => f.key)} strategy={verticalListSortingStrategy}>
                {fields.map((field) => (
                  <SortableRow
                    key={field.key}
                    field={field}
                    onFieldUpdate={(updatedField) => updateField(field.key, updatedField)}
                    onFieldDelete={deleteField}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="block sm:hidden space-y-4">
        {fields.map((field) => (
          <div key={field.key} className="rounded-md border p-4 space-y-3 group">
            <div className="flex items-center justify-between">
              <div className="font-medium">{field.label}</div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteField(field.key)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 hover:bg-red-50 p-1 h-auto ml-1"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
            
            <div className="space-y-2">
              <div>
                <Label className="text-sm text-gray-600">Type</Label>
                <Select
                  value={field.field_type || 'text'}
                  onValueChange={(newType: CardField['field_type']) => updateField(field.key, { ...field, field_type: newType })}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="phone">Phone</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="select">Select</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(field.field_type === 'select' || field.field_type === 'checkbox') && (
                <div>
                  <Label className="text-sm text-gray-600">Options</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {field.options?.map((option, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {option}
                      </Badge>
                    ))}
                    {(!field.options || field.options.length === 0) && (
                      <span className="text-sm text-gray-500">No options</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Visible</span>
              <Switch
                checked={field.visible}
                onCheckedChange={(visible) => updateField(field.key, { ...field, visible, required: visible ? field.required : false })}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Required</span>
              <Switch
                checked={field.required}
                onCheckedChange={(required) => updateField(field.key, { ...field, required })}
                disabled={!field.visible}
              />
            </div>
          </div>
        ))}
      </div>
    </>
  );
} 