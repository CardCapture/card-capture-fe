import React, { memo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Copy, Check, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface SFTPConfig {
  host: string;
  username: string;
  password: string;
  remote_path: string;
}

interface IntegrationsSectionProps {
  sftpConfig: SFTPConfig;
  setSftpConfig: React.Dispatch<React.SetStateAction<SFTPConfig>>;
  saving: boolean;
  saveSftpConfig: () => Promise<void>;
  testSftpConnection: () => Promise<void>;
}

const IntegrationsSection: React.FC<IntegrationsSectionProps> = ({
  sftpConfig,
  setSftpConfig,
  saving,
  saveSftpConfig,
  testSftpConnection,
}) => {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const staticIpAddress = "34.71.193.163";

  const copyIpAddress = async () => {
    try {
      await navigator.clipboard.writeText(staticIpAddress);
      setCopied(true);
      toast({
        title: "IP Address Copied!",
        description: "The static IP address has been copied to your clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Please manually copy the IP address: " + staticIpAddress,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Static IP Address Card */}
      <Card>
        <CardHeader 
          className="cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                Card Capture Static IP Address
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                )}
              </CardTitle>
              <CardDescription>
                {isExpanded 
                  ? "If your system requires IP whitelisting to receive data from Card Capture, please add our static IP address to your allowed list."
                  : "Click to expand for IP whitelisting instructions"
                }
              </CardDescription>
            </div>
          </div>
          
          {/* Always visible IP address section */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border mt-4">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Static IP Address</Label>
              <div className="font-mono text-lg font-semibold text-blue-600">
                {staticIpAddress}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation(); // Prevent card expansion when clicking copy
                copyIpAddress();
              }}
              className="flex items-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        
        {/* Collapsible content */}
        {isExpanded && (
          <CardContent className="pt-0">
            <div className="text-sm text-gray-600 space-y-2">
              <p>
                <strong>What to do with this IP address:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Add this IP to your firewall's allowed list</li>
                <li>Configure your SMTP server to accept connections from this IP</li>
                <li>Whitelist this IP in any security systems that might block our data exports</li>
                <li>Share this IP with your IT team if they manage your network security</li>
              </ul>
              <p className="mt-3">
                <strong>Need help?</strong> Contact our support team if you need assistance 
                with IP whitelisting or have questions about integrating with Card Capture.
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* SFTP Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle>Slate Integration (SFTP)</CardTitle>
          <CardDescription>
            Enter your Slate SFTP credentials to enable export.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="host">Host</Label>
            <Input
              id="host"
              value={sftpConfig.host}
              onChange={(e) =>
                setSftpConfig((prev) => ({ ...prev, host: e.target.value }))
              }
              placeholder="ft.technolutions.net"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={sftpConfig.username}
              onChange={(e) =>
                setSftpConfig((prev) => ({
                  ...prev,
                  username: e.target.value,
                }))
              }
              placeholder="your-username"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={sftpConfig.password}
              onChange={(e) =>
                setSftpConfig((prev) => ({
                  ...prev,
                  password: e.target.value,
                }))
              }
              placeholder="••••••••"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="remote_path">Upload Path</Label>
            <Input
              id="remote_path"
              value={sftpConfig.remote_path}
              onChange={(e) =>
                setSftpConfig((prev) => ({
                  ...prev,
                  remote_path: e.target.value,
                }))
              }
              placeholder="/test/incoming/cardcapture"
            />
          </div>
        </CardContent>
        <CardFooter className="justify-end space-x-2">
          <Button
            variant="outline"
            onClick={testSftpConnection}
            disabled={saving}
          >
            Test Connection
          </Button>
          <Button onClick={saveSftpConfig} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default memo(IntegrationsSection);
export { IntegrationsSection };
