import { Switch } from './ui/switch';
import { Button } from './ui/button';
import { Trash2 } from 'lucide-react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface CardField {
  key: string;
  label: string;
  visible: boolean;
  required: boolean;
}

interface CardFieldPreferencesProps {
  fields: CardField[];
  onFieldsChange: (fields: CardField[]) => void;
}

function DraggableRow({ field, listeners, attributes, isDragging, setNodeRef, style, children }: any) {
  return (
    <tr
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`border-t ${isDragging ? 'bg-gray-100' : ''}`}
    >
      {children}
    </tr>
  );
}

export function CardFieldPreferences({ fields, onFieldsChange }: CardFieldPreferencesProps) {
  console.log('[CardFieldPreferences] fields:', fields);

  const updateVisible = (key: string, visible: boolean) => {
    onFieldsChange(fields.map(field => {
      if (field.key === key) {
        return {
          ...field,
          visible,
          required: visible ? field.required : false
        };
      }
      return field;
    }));
  };

  const updateRequired = (key: string, required: boolean) => {
    onFieldsChange(fields.map(field => {
      if (field.key === key) {
        return { ...field, required };
      }
      return field;
    }));
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

  return (
    <>
      {/* Desktop layout with drag-and-drop */}
      <div className="hidden sm:block">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={fields.map(f => f.key)} strategy={verticalListSortingStrategy}>
            <table className="w-full text-sm">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="py-2 text-left">Field</th>
                  <th className="py-2 text-center">Visible</th>
                  <th className="py-2 text-center">Required</th>
                </tr>
              </thead>
              <tbody>
                {fields.map((field) => (
                  <SortableRow key={field.key} id={field.key} field={field} updateVisible={updateVisible} updateRequired={updateRequired} deleteField={deleteField} />
                ))}
              </tbody>
            </table>
          </SortableContext>
        </DndContext>
      </div>

      {/* Mobile layout */}
      <div className="block sm:hidden space-y-4">
        {fields.map((field) => (
          <div key={field.key} className="rounded-md border p-4 space-y-2 group">
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
            <div className="flex items-center justify-between">
              <span className="text-sm">Visible</span>
              <Switch
                checked={field.visible}
                onCheckedChange={(v) => updateVisible(field.key, v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Required</span>
              <Switch
                checked={field.required}
                onCheckedChange={(v) => updateRequired(field.key, v)}
                disabled={!field.visible}
              />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function SortableRow({ id, field, updateVisible, updateRequired, deleteField }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: 'grab',
  };
  return (
    <DraggableRow
      field={field}
      listeners={listeners}
      attributes={attributes}
      isDragging={isDragging}
      setNodeRef={setNodeRef}
      style={style}
    >
      <td className="py-2 flex items-center gap-2 group">
        <span className="cursor-grab text-gray-400" aria-label="Drag handle">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="7" cy="6" r="1.5" fill="currentColor"/>
            <circle cx="7" cy="10" r="1.5" fill="currentColor"/>
            <circle cx="7" cy="14" r="1.5" fill="currentColor"/>
            <circle cx="13" cy="6" r="1.5" fill="currentColor"/>
            <circle cx="13" cy="10" r="1.5" fill="currentColor"/>
            <circle cx="13" cy="14" r="1.5" fill="currentColor"/>
          </svg>
        </span>
        <span>{field.label}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => deleteField(field.key)}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 hover:bg-red-50 p-1 h-auto ml-1"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </td>
      <td className="py-2 text-center">
        <Switch
          checked={field.visible}
          onCheckedChange={(v) => updateVisible(field.key, v)}
        />
      </td>
      <td className="py-2 text-center">
        <Switch
          checked={field.required}
          onCheckedChange={(v) => updateRequired(field.key, v)}
          disabled={!field.visible}
        />
      </td>
    </DraggableRow>
  );
} 