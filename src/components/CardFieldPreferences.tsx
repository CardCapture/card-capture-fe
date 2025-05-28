import { Switch } from './ui/switch';

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

export function CardFieldPreferences({ fields, onFieldsChange }: CardFieldPreferencesProps) {
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

  return (
    <>
      {/* Desktop layout */}
      <div className="hidden sm:block">
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
              <tr key={field.key} className="border-t">
                <td className="py-2">{field.label}</td>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile layout */}
      <div className="block sm:hidden space-y-4">
        {fields.map((field) => (
          <div key={field.key} className="rounded-md border p-4 space-y-2">
            <div className="font-medium">{field.label}</div>
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