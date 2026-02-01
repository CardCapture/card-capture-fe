import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { accountLinkingApi, LinkRequest } from "@/api/backend/accountLinking";
import { toast } from "@/lib/toast";
import { logger } from '@/utils/logger';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  UserPlus,
  Calendar,
  Mail,
  Check,
  X,
  Clock,
  AlertCircle,
  ChevronRight,
} from "lucide-react";

interface PendingMergeRequestsBannerProps {
  onUserMerged?: () => void;
}

export function PendingMergeRequestsBanner({ onUserMerged }: PendingMergeRequestsBannerProps) {
  const { session } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [requests, setRequests] = useState<LinkRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: "approve" | "reject";
    request: LinkRequest;
  } | null>(null);

  // Check URL for merge_request parameter to auto-open dialog
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const mergeRequestId = urlParams.get("merge_request");
    if (mergeRequestId) {
      setIsDialogOpen(true);
      // Clean up the URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, []);

  // Fetch pending count on mount
  const fetchPendingCount = useCallback(async () => {
    try {
      const response = await accountLinkingApi.getPendingCount(
        session?.access_token
      );
      setPendingCount(response.count);
    } catch (error) {
      logger.error("Error fetching pending count:", error);
    }
  }, [session?.access_token]);

  useEffect(() => {
    fetchPendingCount();
  }, [fetchPendingCount]);

  // Fetch full requests when dialog opens
  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const response = await accountLinkingApi.getLinkRequests(
        { status: "pending" },
        session?.access_token
      );
      setRequests(response.requests);
    } catch (error) {
      logger.error("Error fetching requests:", error);
      toast.error("Failed to load link requests");
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    if (isDialogOpen) {
      fetchRequests();
    }
  }, [isDialogOpen, fetchRequests]);

  const handleApprove = async (request: LinkRequest) => {
    setActionLoading(request.id);
    try {
      await accountLinkingApi.approveLinkRequest(
        request.id,
        undefined,
        session?.access_token
      );
      toast.success(
        `${request.requester?.first_name} ${request.requester?.last_name} has been added to your team`
      );
      // Remove from local state
      setRequests((prev) => prev.filter((r) => r.id !== request.id));
      setPendingCount((prev) => Math.max(0, prev - 1));
      // Notify parent to refresh users list
      onUserMerged?.();
    } catch (error) {
      logger.error("Error approving request:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to approve request"
      );
    } finally {
      setActionLoading(null);
      setConfirmAction(null);
    }
  };

  const handleReject = async (request: LinkRequest) => {
    setActionLoading(request.id);
    try {
      await accountLinkingApi.rejectLinkRequest(
        request.id,
        undefined,
        session?.access_token
      );
      toast.success("Request rejected");
      // Remove from local state
      setRequests((prev) => prev.filter((r) => r.id !== request.id));
      setPendingCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      logger.error("Error rejecting request:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to reject request"
      );
    } finally {
      setActionLoading(null);
      setConfirmAction(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Don't render if no pending requests
  if (pendingCount === 0) {
    return null;
  }

  return (
    <>
      {/* Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4 animate-in fade-in slide-in-from-top-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-100">
              <UserPlus className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-amber-900">
                  Pending User Link Requests
                </span>
                <Badge
                  variant="secondary"
                  className="bg-amber-200 text-amber-800 hover:bg-amber-200"
                >
                  {pendingCount}
                </Badge>
              </div>
              <p className="text-sm text-amber-700">
                {pendingCount === 1
                  ? "A recruiter has signed up and wants to join your school"
                  : `${pendingCount} recruiters have signed up and want to join your school`}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            className="border-amber-300 text-amber-700 hover:bg-amber-100"
            onClick={() => setIsDialogOpen(true)}
          >
            Review Requests
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Requests Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Account Link Request
            </DialogTitle>
            <DialogDescription>
              Review recruiters who want to join your CardCapture account. Approve to see their scans.
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No pending link requests</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <Card
                  key={request.id}
                  className="border-l-4 border-l-amber-400"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Recruiter Info */}
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 font-medium">
                              {request.requester?.first_name?.[0]}
                              {request.requester?.last_name?.[0]}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
                              {request.requester?.first_name}{" "}
                              {request.requester?.last_name}
                            </p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {request.requester?.email}
                            </p>
                          </div>
                        </div>

                        {/* Events Info */}
                        <div className="mt-3 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground mb-2">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {(request.purchased_events?.length || 1) === 1
                                ? "Event"
                                : `${request.purchased_events?.length} Events`}
                            </span>
                          </div>
                          <div className="space-y-2 ml-6">
                            {request.purchased_events && request.purchased_events.length > 0 ? (
                              request.purchased_events.map((pe, index) => (
                                <div key={pe.event.id || index} className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium text-foreground">
                                      {pe.event.name}
                                    </p>
                                    <p className="text-muted-foreground text-xs">
                                      {pe.event.event_date
                                        ? formatDate(pe.event.event_date)
                                        : "Date TBD"}
                                    </p>
                                  </div>
                                  <span className="text-green-600 font-medium">
                                    ${((pe.purchase?.amount || 2500) / 100).toFixed(0)}
                                  </span>
                                </div>
                              ))
                            ) : (
                              // Fallback to single event (backwards compatibility)
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-foreground">
                                    {request.universal_event?.name}
                                  </p>
                                  <p className="text-muted-foreground text-xs">
                                    {request.universal_event?.event_date
                                      ? formatDate(request.universal_event.event_date)
                                      : "Date TBD"}
                                  </p>
                                </div>
                                <span className="text-green-600 font-medium">
                                  ${((request.event_purchase?.amount || 2500) / 100).toFixed(0)}
                                </span>
                              </div>
                            )}
                            {/* Total if multiple events */}
                            {request.purchased_events && request.purchased_events.length > 1 && (
                              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                                <p className="font-medium text-foreground">Total</p>
                                <span className="text-green-600 font-semibold">
                                  ${((request.total_amount || 0) / 100).toFixed(0)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Request Date */}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-3">
                          <Clock className="w-3 h-3" />
                          Requested {formatDate(request.created_at)}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          onClick={() =>
                            setConfirmAction({ type: "approve", request })
                          }
                          disabled={actionLoading === request.id}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setConfirmAction({ type: "reject", request })
                          }
                          disabled={actionLoading === request.id}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={confirmAction !== null}
        onOpenChange={(open) => !open && setConfirmAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === "approve"
                ? "Approve Link Request"
                : "Reject Link Request"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === "approve" ? (
                <>
                  Are you sure you want to approve{" "}
                  <strong>
                    {confirmAction.request.requester?.first_name}{" "}
                    {confirmAction.request.requester?.last_name}
                  </strong>
                  's request to join your school?
                  <br />
                  <br />
                  This will:
                  <ul className="list-disc ml-4 mt-2">
                    <li>Add them to your school's user list</li>
                    <li>Give them access to school events and data</li>
                    <li>
                      Transfer their purchased {(confirmAction.request.purchased_events?.length || 1) === 1 ? "event" : `${confirmAction.request.purchased_events?.length} events`} to your school
                    </li>
                  </ul>
                </>
              ) : (
                <>
                  Are you sure you want to reject{" "}
                  <strong>
                    {confirmAction?.request.requester?.first_name}{" "}
                    {confirmAction?.request.requester?.last_name}
                  </strong>
                  's request to join your school?
                  <br />
                  <br />
                  They will continue using CardCapture independently and can
                  still access their own event data.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading !== null}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmAction?.type === "approve") {
                  handleApprove(confirmAction.request);
                } else if (confirmAction?.type === "reject") {
                  handleReject(confirmAction.request);
                }
              }}
              disabled={actionLoading !== null}
              className={
                confirmAction?.type === "approve"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }
            >
              {actionLoading
                ? confirmAction?.type === "approve"
                  ? "Approving..."
                  : "Rejecting..."
                : confirmAction?.type === "approve"
                ? "Approve"
                : "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
