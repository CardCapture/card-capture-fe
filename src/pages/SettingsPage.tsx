import { useState, useEffect } from 'react';
import { CardFieldPreferences } from '../components/CardFieldPreferences';
import { useToast } from '../hooks/use-toast';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface CardField {
  key: string;
  label: string;
  visible: boolean;
  required: boolean;
}

export function SettingsPage() {
  const [fields, setFields] = useState<CardField[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { session } = useAuth();

  useEffect(() => {
    if (session?.user?.id) {
      loadFieldPreferences();
    }
  }, [session]);

  const loadFieldPreferences = async () => {
    if (!session?.user?.id) return;

    try {
      const { data: settings, error } = await supabase
        .from('settings')
        .select('preferences')
        .eq('user_id', session.user.id)
        .single();

      if (error) throw error;

      const cardFields = settings?.preferences?.card_fields || {};
      const formattedFields = Object.entries(cardFields).map(([key, value]: [string, any]) => ({
        key,
        label: key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        visible: value.enabled,
        required: value.required
      }));

      setFields(formattedFields);
    } catch (error) {
      console.error('Error loading field preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to load field preferences',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (updatedFields: CardField[]) => {
    if (!session?.user?.id) return;

    try {
      const cardFields = updatedFields.reduce((acc, field) => ({
        ...acc,
        [field.key]: {
          enabled: field.visible,
          required: field.required
        }
      }), {});

      const { error } = await supabase
        .from('settings')
        .upsert({
          user_id: session.user.id,
          preferences: { card_fields: cardFields }
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Field preferences saved successfully'
      });
    } catch (error) {
      console.error('Error saving field preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to save field preferences',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
        <Link to="/settings/field-preferences" className="hover:text-foreground transition-colors">
          Field Preferences
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">Manage Fields</span>
      </div>
      <h1 className="text-2xl font-bold mb-6">Manage Fields</h1>
      <CardFieldPreferences fields={fields} onSave={handleSave} />
    </div>
  );
} 