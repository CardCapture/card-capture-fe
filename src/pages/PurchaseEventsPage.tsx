/**
 * Event purchase page for authenticated admin users.
 * Allows admins to purchase access to TACROA events at $17 each.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Calendar, MapPin, Clock, Search, Loader2, ChevronLeft, ChevronRight, Check, CalendarX, X, ShoppingCart, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { logger } from '@/utils/logger';
import recruiterSignupService, { UniversalEvent, purchaseEventsAsAdmin } from '@/services/RecruiterSignupService';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';

const PRICE_PER_EVENT = 17;

const PurchaseEventsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { profile } = useAuth();
  const { canPurchaseEvents } = useRole();
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for cancelled payment
  const wasCancelled = searchParams.get('cancelled') === 'true';

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [stateFilter, setStateFilter] = useState<string>('');
  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [events, setEvents] = useState<UniversalEvent[]>([]);
  const [selectedEvents, setSelectedEvents] = useState<UniversalEvent[]>([]);
  const [totalEvents, setTotalEvents] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const eventsPerPage = 10;

  // Sheet state
  const [sheetOpen, setSheetOpen] = useState(false);

  // Verify access
  useEffect(() => {
    if (!canPurchaseEvents) {
      navigate('/events');
    }
  }, [canPurchaseEvents, navigate]);

  // Fetch available states on mount
  useEffect(() => {
    recruiterSignupService.getStates().then(setAvailableStates).catch(() => {});
  }, []);

  // Search events when page loads or search/filter changes
  useEffect(() => {
    const searchEvents = async () => {
      try {
        setSearchLoading(true);
        const response = await recruiterSignupService.searchEvents({
          query: searchQuery || undefined,
          state: stateFilter || undefined,
          page: currentPage,
          limit: eventsPerPage,
        });
        setEvents(response.events);
        setTotalEvents(response.total);
        setTotalPages(response.pages);
      } catch (err) {
        logger.error('Failed to search events:', err);
        setError('Failed to load events. Please try again.');
      } finally {
        setSearchLoading(false);
      }
    };

    const debounce = setTimeout(searchEvents, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, stateFilter, currentPage]);

  // Open sheet when events are selected
  useEffect(() => {
    if (selectedEvents.length > 0) {
      setSheetOpen(true);
    }
  }, [selectedEvents.length]);

  // Get today's date string in YYYY-MM-DD format for comparison
  const getTodayString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Split events into today's events and other events
  const { todayEvents, otherEvents } = useMemo(() => {
    const todayStr = getTodayString();
    const today: UniversalEvent[] = [];
    const other: UniversalEvent[] = [];

    events.forEach(event => {
      if (event.event_date === todayStr) {
        today.push(event);
      } else {
        other.push(event);
      }
    });

    return { todayEvents: today, otherEvents: other };
  }, [events]);

  // Calculate total price
  const totalPrice = selectedEvents.length * PRICE_PER_EVENT;

  // Check if an event is selected
  const isEventSelected = (eventId: string) => {
    return selectedEvents.some(e => e.id === eventId);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatShortDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Select/deselect event (supports multiple selection)
  const handleEventSelect = (event: UniversalEvent) => {
    setError(null);
    setSelectedEvents(prev => {
      const isAlreadySelected = prev.some(e => e.id === event.id);
      if (isAlreadySelected) {
        const newSelection = prev.filter(e => e.id !== event.id);
        if (newSelection.length === 0) {
          setSheetOpen(false);
        }
        return newSelection;
      } else {
        return [...prev, event];
      }
    });
  };

  // Remove event from selection
  const handleRemoveEvent = (eventId: string) => {
    setSelectedEvents(prev => {
      const newSelection = prev.filter(e => e.id !== eventId);
      if (newSelection.length === 0) {
        setSheetOpen(false);
      }
      return newSelection;
    });
  };

  const handleContinueToPayment = async () => {
    if (selectedEvents.length === 0) {
      setError('Please select at least one event');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await purchaseEventsAsAdmin(selectedEvents.map(e => e.id));

      // Redirect to Stripe checkout
      window.location.href = response.checkout_url;
    } catch (err: any) {
      setError(err.message || 'Failed to create checkout session. Please try again.');
      setLoading(false);
    }
  };

  // Render an event card
  const renderEventCard = (event: UniversalEvent, isToday: boolean = false) => {
    const selected = isEventSelected(event.id);
    return (
      <Card
        key={event.id}
        className={cn(
          "cursor-pointer transition-all hover:shadow-md",
          isToday && "border-primary/20 bg-primary/5",
          selected && "ring-2 ring-primary"
        )}
        onClick={() => handleEventSelect(event)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-lg">{event.name}</h3>
                {isToday && (
                  <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full font-medium">
                    Today
                  </span>
                )}
                {selected && (
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary">
                    <Check className="h-3 w-3 text-white" />
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {!isToday && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(event.event_date)}</span>
                  </div>
                )}
                {event.start_time && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>
                      {formatTime(event.start_time)}
                      {event.end_time && ` - ${formatTime(event.end_time)}`}
                    </span>
                  </div>
                )}
                {(event.city || event.location) && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {event.location && `${event.location}, `}
                      {event.city}, {event.state || 'TX'}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="text-right">
              <span className="text-lg font-semibold text-primary">$17</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (!canPurchaseEvents) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const panelOpen = sheetOpen && selectedEvents.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Main content area - shrinks when panel is open */}
        <div
          className={cn(
            "flex-1 py-8 px-4 transition-all duration-300 ease-in-out",
            panelOpen ? "mr-[380px]" : "mr-0"
          )}
        >
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold">Purchase Events</h1>
              <p className="text-muted-foreground mt-2">
                Select events to add to your account.
              </p>
            </div>

            {/* Cancelled payment alert */}
            {wasCancelled && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 mb-6 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800">Payment cancelled</p>
                  <p className="text-sm text-amber-700">Your payment was cancelled. Select events below to try again.</p>
                </div>
              </div>
            )}

            {/* Search */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by event name, city, state, or venue..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="pl-10"
                    />
                  </div>
                  <Select
                    value={stateFilter}
                    onValueChange={(value) => {
                      setStateFilter(value === 'all' ? '' : value);
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="All States" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All States</SelectItem>
                      {availableStates.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Events list */}
            {searchLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Today's Events Section */}
                <div className="mb-8">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Today's Events
                  </h2>
                  {todayEvents.length === 0 ? (
                    <Card className="border-dashed">
                      <CardContent className="py-8 text-center">
                        <CalendarX className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                        <p className="text-muted-foreground font-medium">No Events Today</p>
                        <p className="text-sm text-muted-foreground/70 mt-1">
                          Browse upcoming events below
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {todayEvents.map((event) => renderEventCard(event, true))}
                    </div>
                  )}
                </div>

                {/* Upcoming Events Section */}
                <div className="mb-6">
                  <h2 className="text-lg font-semibold mb-4">Upcoming Events</h2>
                  {otherEvents.length === 0 && todayEvents.length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground">No events found. Try a different search.</p>
                      </CardContent>
                    </Card>
                  ) : otherEvents.length === 0 ? (
                    <Card className="border-dashed">
                      <CardContent className="py-6 text-center">
                        <p className="text-muted-foreground text-sm">No other events match your search.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {otherEvents.map((event) => renderEventCard(event, false))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-muted-foreground">
                  Showing {((currentPage - 1) * eventsPerPage) + 1} - {Math.min(currentPage * eventsPerPage, totalEvents)} of {totalEvents} events
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="rounded-lg bg-destructive/10 p-4 mb-6">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right side panel - fixed position */}
        <div
          className={cn(
            "fixed right-0 top-0 h-full w-[380px] bg-background border-l shadow-lg transition-transform duration-300 ease-in-out flex flex-col z-40",
            panelOpen ? "translate-x-0" : "translate-x-full"
          )}
        >
          {/* Panel Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="font-semibold flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Selected Event{selectedEvents.length !== 1 ? 's' : ''} ({selectedEvents.length})
            </h2>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setSheetOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {selectedEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No events selected</p>
                <p className="text-sm mt-1">Click on an event to add it</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{event.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatShortDate(event.event_date)}
                        {event.start_time && ` at ${formatTime(event.start_time)}`}
                      </p>
                      {event.city && (
                        <p className="text-xs text-muted-foreground">
                          {event.city}, {event.state || 'TX'}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-primary">$17</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveEvent(event.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Panel Footer */}
          <div className="border-t p-4 space-y-4">
            {/* Error message in panel */}
            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total</span>
              <span className="text-2xl font-bold">${totalPrice}</span>
            </div>
            <Button
              className="w-full"
              size="lg"
              onClick={handleContinueToPayment}
              disabled={selectedEvents.length === 0 || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Continue to Payment'
              )}
            </Button>
          </div>
        </div>

        {/* Floating cart button when panel is closed but items are selected */}
        {selectedEvents.length > 0 && !sheetOpen && (
          <Button
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
            onClick={() => setSheetOpen(true)}
          >
            <ShoppingCart className="h-6 w-6" />
            <span className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-destructive text-white text-xs flex items-center justify-center font-bold">
              {selectedEvents.length}
            </span>
          </Button>
        )}
      </div>
    </div>
  );
};

export default PurchaseEventsPage;
