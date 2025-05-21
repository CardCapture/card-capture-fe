import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/card';
import { Switch } from './ui/switch';
import { Button } from './ui/button';

interface CardField {
  key: string;
  label: string;
  visible: boolean;
  required: boolean;
}

interface CardFieldPreferencesProps {
  fields: CardField[];
  onSave: (fields: CardField[]) => void;
}

export function CardFieldPreferences({ fields: initialFields, onSave }: CardFieldPreferencesProps) {
  const [fields, setFields] = useState<CardField[]>(initialFields);

  const updateVisible = (key: string, visible: boolean) => {
    setFields(fields.map(field => {
      if (field.key === key) {
        return {
          ...field,
          visible,
          // If field is hidden, it cannot be required
          required: visible ? field.required : false
        };
      }
      return field;
    }));
  };

  const updateRequired = (key: string, required: boolean) => {
    setFields(fields.map(field => {
      if (field.key === key) {
        return { ...field, required };
      }
      return field;
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardDescription>
          Choose which fields appear during review and which are required.
        </CardDescription>
      </CardHeader>

      {/* Desktop layout */}
      <CardContent className="hidden sm:block">
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
      </CardContent>

      {/* Mobile layout */}
      <CardContent className="block sm:hidden space-y-4">
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
      </CardContent>

      <CardFooter className="justify-end">
        <Button onClick={() => onSave(fields)}>Save Changes</Button>
      </CardFooter>
    </Card>
  );
} 