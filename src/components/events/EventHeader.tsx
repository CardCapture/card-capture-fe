import React from "react";
import { ChevronRight, Pencil, Check, Loader2, X } from "lucide-react";

interface EventHeaderProps {
  selectedEvent: { name: string } | null;
  isEditingEventName: boolean;
  eventNameInput: string;
  eventNameError: string | null;
  eventNameLoading: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const EventHeader: React.FC<EventHeaderProps> = ({
  selectedEvent,
  isEditingEventName,
  eventNameInput,
  eventNameError,
  eventNameLoading,
  onEdit,
  onCancel,
  onSave,
  onInputChange,
}) => (
  <div className="space-y-4">
    <nav aria-label="Breadcrumb" className="mb-2 text-sm text-gray-500">
      <ol className="flex items-center space-x-1">
        <li className="flex items-center">
          <a href="/events" className="text-blue-600 hover:underline">
            Events
          </a>
          <ChevronRight className="mx-1 w-3 h-3 text-gray-400" />
        </li>
        <li className="font-medium text-gray-900">{selectedEvent?.name}</li>
      </ol>
    </nav>
    <div className="flex flex-col text-left w-full md:w-auto">
      <h1 className="text-2xl font-semibold text-gray-900 mb-2 text-left flex items-center gap-2">
        {isEditingEventName ? (
          <>
            <input
              className="border rounded px-2 py-1 text-lg font-semibold w-64 max-w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={eventNameInput}
              onChange={onInputChange}
              disabled={eventNameLoading}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") onSave();
                if (e.key === "Escape") onCancel();
              }}
            />
            <button
              className="ml-1 text-green-600 hover:text-green-800 disabled:opacity-50"
              onClick={onSave}
              disabled={eventNameLoading || !eventNameInput.trim()}
              aria-label="Save event name"
            >
              {eventNameLoading ? (
                <Loader2 className="animate-spin w-5 h-5" />
              ) : (
                <Check className="w-5 h-5" />
              )}
            </button>
            <button
              className="ml-1 text-gray-500 hover:text-red-600"
              onClick={onCancel}
              disabled={eventNameLoading}
              aria-label="Cancel edit"
            >
              <X className="w-5 h-5" />
            </button>
          </>
        ) : (
          <>
            <span>{selectedEvent ? selectedEvent.name : "All Events"}</span>
            <button
              className="ml-1 text-gray-400 hover:text-blue-600"
              onClick={onEdit}
              aria-label="Edit event name"
            >
              <Pencil className="w-4 h-4" />
            </button>
          </>
        )}
      </h1>
      {eventNameError && (
        <div className="text-sm text-red-600 mt-1">{eventNameError}</div>
      )}
    </div>
  </div>
);

export default EventHeader;
