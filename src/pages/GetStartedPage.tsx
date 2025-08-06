import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/toast';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

const GetStartedPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    university: '',
    enrollment: '',
    message: ''
  });

  const validateEmail = (email: string) => {
    return email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || !formData.email || !formData.university) {
      toast.required("name, email, and university fields");
      return;
    }

    if (!validateEmail(formData.email)) {
      toast.invalid("email address");
      return;
    }

    setIsLoading(true);

    try {
      // Get API base URL from environment
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      
      // Send demo request to backend
      const response = await fetch(`${API_BASE_URL}/demo/send-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          university: formData.university,
          enrollment: formData.enrollment,
          message: formData.message
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || `Request failed with status ${response.status}`);
      }
      
      toast.success("We've received your information and will be in touch soon.");
      
      // Redirect to thank you page
      navigate('/thank-you');
    } catch (error) {
      console.error("Error submitting demo request:", error);
      toast.error(
        error instanceof Error 
          ? error.message 
          : "Something went wrong. Please try again.", 
        "Error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateEvent = () => {
    // Navigate to events page where they can create an event
    navigate('/events');
    toast.info("Click 'Create Event' to set up your first event", "Ready to Create Event");
  };

  const handleInviteTeam = () => {
    // Navigate to team management
    navigate('/admin');
    toast.info("Use the team management section to invite colleagues", "Team Invitations");
  };

  const handleUploadCard = () => {
    // Check if user has events first
    // This would typically check if they have events
    navigate('/scan');
    toast.warning("Create an event first, then return here to upload cards", "Event Required");
  };

  const handleViewDashboard = () => {
    navigate('/events');
    toast.success("Welcome to your dashboard!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted py-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <ClipboardCheck className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold tracking-tight">Ready to Ditch Data Entry?</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Tell us about your school. We'll reach out to schedule a demo, and discuss pricing.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Request a Demo</CardTitle>
              <CardDescription>
                Fill out the form below and we'll be in touch shortly.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    placeholder="Your name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@university.edu"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="university">Institution *</Label>
                  <Input
                    id="university"
                    placeholder="Your institution's name"
                    value={formData.university}
                    onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="enrollment">Total Enrollment</Label>
                  <div className="relative">
                    <select
                      id="enrollment"
                      value={formData.enrollment}
                      onChange={(e) => setFormData({ ...formData, enrollment: e.target.value })}
                      required
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 pr-8 py-2 text-base text-foreground font-sans ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm appearance-none"
                    >
                      <option value="" disabled className="text-muted-foreground">Select total enrollment</option>
                      <option value="Less than 2,000">Less than 2,000</option>
                      <option value="2,000-5,000">2,000-5,000</option>
                      <option value="5,000-12,000">5,000-12,000</option>
                      <option value="More than 12,000">More than 12,000</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted-foreground">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Tell us about your needs (optional)"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="min-h-[100px]"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="mr-2">Submitting</span>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    </>
                  ) : (
                    'Submit'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default GetStartedPage; 