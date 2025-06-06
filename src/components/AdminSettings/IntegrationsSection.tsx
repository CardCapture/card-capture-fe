import React, { memo } from "react";
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

interface SFTPConfig {
  host: string;
  username: string;
  password: string;
  upload_path: string;
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
  return (
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
          <Label htmlFor="upload_path">Upload Path</Label>
          <Input
            id="upload_path"
            value={sftpConfig.upload_path}
            onChange={(e) =>
              setSftpConfig((prev) => ({
                ...prev,
                upload_path: e.target.value,
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
  );
};

export default memo(IntegrationsSection);
export { IntegrationsSection };
