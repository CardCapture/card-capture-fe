import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/lib/toast";
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { authFetch } from "@/lib/authFetch";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated: () => void;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  isOpen,
  onClose,
  onEventCreated,
}) => {
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { user } = useAuth();
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Fetch school_id from profiles table when modal opens
  React.useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        console.log('No user found in useAuth');
        return;
      }
      setProfileLoading(true);
      console.log('Fetching profile for user id:', user.id);
      const { data, error } = await supabase
        .from('profiles')
        .select('school_id')
        .eq('id', user.id)
        .maybeSingle();
      if (error) {
        console.error('Error fetching profile:', error);
      }
      if (!data) {
        console.warn('No profile data returned for user:', user.id);
      } else {
        console.log('Profile data returned:', data);
      }
      if (error || !data?.school_id) {
        setSchoolId(null);
      } else {
        setSchoolId(data.school_id);
      }
      setProfileLoading(false);
    };
    if (isOpen && user) {
      fetchProfile();
    }
  }, [isOpen, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventName || !eventDate) {
      toast.warning("Please provide both an event name and date.", "Missing Information");
      return;
    }
    if (!schoolId) {
      toast.error("Your user profile is missing a school ID. Please contact support.", "Missing School ID");
      return;
    }
    setIsCreating(true);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const response = await authFetch(`${apiBaseUrl}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: eventName,
          date: eventDate,
          school_id: schoolId,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to create event');
      }
      toast.created("Event");
      onEventCreated();
      onClose();
      setEventName('');
      setEventDate('');
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error("Something went wrong while creating the event. Please try again.", "Creation Failed");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Event Name</Label>
              <Input
                id="name"
                placeholder="Enter event name"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                disabled={isCreating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Event Date</Label>
              <Input
                id="date"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                disabled={isCreating}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isCreating || !eventName || !eventDate}
              className="min-w-[100px]"
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Event'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const ArchiveConfirmation: React.FC<{
  rowSelection: Record<string, boolean>;
  handleArchiveSelected: () => void;
}> = ({ rowSelection, handleArchiveSelected }) => {
  return (
    <AlertDialog>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Archive Cards</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to archive {Object.keys(rowSelection).length} {Object.keys(rowSelection).length === 1 ? 'card' : 'cards'}? 
            Archived cards will be moved to the Archived tab.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleArchiveSelected} className="bg-red-600 hover:bg-red-700 text-white">
            Archive
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}; 