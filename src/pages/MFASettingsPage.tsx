import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import MFAEnrollmentModal from '@/components/MFAEnrollmentModal';
import { supabase } from '@/lib/supabaseClient';
import { logger } from '@/utils/logger';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface TrustedDevice {
  id: string;
  device_name: string;
  last_verified_at: string;
  expires_at: string;
  user_agent: string;
}

const MFASettingsPage: React.FC = () => {
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [trustedDevices, setTrustedDevices] = useState<TrustedDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [deviceToRevoke, setDeviceToRevoke] = useState<string | null>(null);
  
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchMFASettings();
  }, [user]);

  const fetchMFASettings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/mfa/settings', {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMfaEnabled(data.mfa_enabled);
        setPhoneNumber(data.phone_number);
        setTrustedDevices(data.trusted_devices || []);
      }
    } catch (error) {
      logger.error('Failed to fetch MFA settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleMFA = async (enabled: boolean) => {
    if (enabled && !mfaEnabled) {
      // Enable MFA - show enrollment modal
      setShowEnrollModal(true);
    } else if (!enabled && mfaEnabled) {
      // Disable MFA - show confirmation dialog
      setShowDisableDialog(true);
    }
  };

  const handleDisableMFA = async () => {
    try {
      const response = await fetch('/api/mfa/disable', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (response.ok) {
        setMfaEnabled(false);
        setPhoneNumber(null);
        setTrustedDevices([]);
        setShowDisableDialog(false);
      }
    } catch (error) {
      logger.error('Failed to disable MFA:', error);
    }
  };

  const handleRevokeDevice = async (deviceId: string) => {
    try {
      const response = await fetch(`/api/mfa/device/${deviceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (response.ok) {
        setTrustedDevices(devices => devices.filter(d => d.id !== deviceId));
        setDeviceToRevoke(null);
      }
    } catch (error) {
      logger.error('Failed to revoke device:', error);
    }
  };

  const formatPhoneNumber = (phone: string) => {
    // Mask phone number showing only last 4 digits
    if (!phone) return '';
    return `••• ••• ${phone.slice(-4)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDeviceIcon = (userAgent: string) => {
    if (userAgent.includes('Mobile')) {
      return '📱';
    } else if (userAgent.includes('Tablet')) {
      return '📱';
    } else {
      return '💻';
    }
  };

  const isCurrentDevice = (device: TrustedDevice) => {
    const currentToken = localStorage.getItem('device_token');
    // This is simplified - in production, you'd compare hashed tokens
    return false; // Placeholder
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Security Settings</h1>

      {/* MFA Status Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="mfa-toggle" className="text-base">
                  Enable Two-Factor Authentication
                </Label>
                <p className="text-sm text-muted-foreground">
                  Require a verification code in addition to your password
                </p>
              </div>
              <Switch
                id="mfa-toggle"
                checked={mfaEnabled}
                onCheckedChange={handleToggleMFA}
              />
            </div>

            {mfaEnabled && phoneNumber && (
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">Phone Number</p>
                    <p className="text-sm text-muted-foreground">
                      {formatPhoneNumber(phoneNumber)}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowEnrollModal(true)}
                  >
                    Update Phone
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Trusted Devices Card */}
      {mfaEnabled && (
        <Card>
          <CardHeader>
            <CardTitle>Trusted Devices</CardTitle>
            <CardDescription>
              Devices that don't require verification codes for 30 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            {trustedDevices.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No trusted devices. You'll be prompted to trust a device after your next login with 2FA.
              </p>
            ) : (
              <div className="space-y-3">
                {trustedDevices.map((device) => (
                  <div
                    key={device.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">
                        {getDeviceIcon(device.user_agent)}
                      </span>
                      <div>
                        <p className="font-medium">
                          {device.device_name}
                          {isCurrentDevice(device) && (
                            <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              Current Device
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Last used: {formatDate(device.last_verified_at)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Expires: {formatDate(device.expires_at)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeviceToRevoke(device.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Revoke
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Enrollment Modal */}
      <MFAEnrollmentModal
        isOpen={showEnrollModal}
        onClose={() => {
          setShowEnrollModal(false);
          fetchMFASettings();
        }}
        onComplete={() => {
          setShowEnrollModal(false);
          fetchMFASettings();
        }}
        isRequired={false}
      />

      {/* Disable MFA Confirmation Dialog */}
      <AlertDialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable Two-Factor Authentication?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the extra security layer from your account. You'll only need your password to sign in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisableMFA}
              className="bg-red-600 hover:bg-red-700"
            >
              Disable 2FA
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revoke Device Confirmation Dialog */}
      <AlertDialog
        open={!!deviceToRevoke}
        onOpenChange={() => setDeviceToRevoke(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Device Access?</AlertDialogTitle>
            <AlertDialogDescription>
              This device will need to verify with a code on the next login.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deviceToRevoke && handleRevokeDevice(deviceToRevoke)}
            >
              Revoke Access
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MFASettingsPage;