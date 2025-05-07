import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { authFetch } from "@/lib/authFetch";

const AdminSettings: React.FC = () => {
    const { toast } = useToast();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteArchived = async () => {
        try {
            setIsDeleting(true);
            const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
            const response = await authFetch(`${apiBaseUrl}/admin/delete-archived`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({}),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete archived cards');
            }

            toast({
                title: "Success",
                description: "Successfully deleted all archived cards from the database",
            });
        } catch (error: any) {
            console.error('Error deleting archived cards:', error);
            toast({
                title: "Error",
                description: error.message || "An unknown error occurred",
                variant: "destructive",
            });
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-8">Admin Settings</h1>
            
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Data Management</CardTitle>
                    <CardDescription>Permanently delete data from the database</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-gray-500 mb-4">
                        Warning: These actions will permanently delete data from the database and cannot be undone.
                    </p>
                    
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-medium mb-2">Archived Cards</h3>
                            <p className="text-sm text-gray-500 mb-4">
                                Permanently delete all archived cards from the database.
                            </p>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" disabled={isDeleting}>
                                        {isDeleting ? "Deleting..." : "Delete All Archived Cards"}
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action will permanently delete all archived cards from the database.
                                            This action cannot be undone.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleDeleteArchived} className="bg-red-600 hover:bg-red-700">
                                            Delete
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminSettings; 