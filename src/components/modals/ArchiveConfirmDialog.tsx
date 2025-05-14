import React from "react";
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

interface ArchiveConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  count: number;
  singleCard?: boolean;
}

const ArchiveConfirmDialog: React.FC<ArchiveConfirmDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  count,
  singleCard = false,
}) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Archive Cards</AlertDialogTitle>
        <AlertDialogDescription>
          Are you sure you want to archive{" "}
          {singleCard
            ? "this card"
            : `${count} ${count === 1 ? "card" : "cards"}`}
          ? Archived cards will be moved to the Archived tab.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction
          onClick={onConfirm}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          Archive
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

export default ArchiveConfirmDialog;
