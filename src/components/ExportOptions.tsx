
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileSpreadsheet, Database, ArrowRight, CheckCircle } from 'lucide-react';

const ExportOptions = () => {
  const [exporting, setExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);
  const [crmDetails, setCrmDetails] = useState({
    apiUrl: '',
    apiKey: '',
    connected: false
  });

  const handleExportSpreadsheet = () => {
    setExporting(true);
    
    // Simulate export process
    setTimeout(() => {
      setExporting(false);
      setExportComplete(true);
      
      // Reset state after 3 seconds
      setTimeout(() => {
        setExportComplete(false);
      }, 3000);
    }, 2000);
  };
  
  const handleConnectCRM = (e: React.FormEvent) => {
    e.preventDefault();
    
    setCrmDetails(prev => ({
      ...prev,
      connected: true
    }));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <Card className="glass-panel overflow-hidden">
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="p-2 rounded-full bg-primary/10">
              <FileSpreadsheet className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Spreadsheet Export</CardTitle>
              <CardDescription>
                Download your data in CSV or Excel format
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Processed cards</span>
                <span className="text-sm text-foreground/70">12 cards</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Export format</span>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" className="h-8 rounded-full">CSV</Button>
                  <Button variant="outline" size="sm" className="h-8 rounded-full bg-primary/10">Excel</Button>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-sm font-medium">Include images</span>
                <div className="flex items-center h-5">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </div>
              </div>
            </div>
            
            <div className="pt-2">
              <Button 
                onClick={handleExportSpreadsheet} 
                className="w-full"
                disabled={exporting}
              >
                {exporting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Exporting...
                  </>
                ) : exportComplete ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" /> Export Complete
                  </>
                ) : (
                  <>
                    Download Spreadsheet
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="glass-panel overflow-hidden">
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="p-2 rounded-full bg-blue-500/10">
              <Database className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <CardTitle>CRM Integration</CardTitle>
              <CardDescription>
                Connect and upload data to your CRM
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {crmDetails.connected ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-center">
                <CheckCircle className="mx-auto h-8 w-8 text-green-500 mb-2" />
                <h4 className="font-medium text-green-800">Successfully Connected</h4>
                <p className="text-sm text-green-600">Your CRM is now connected and ready to receive data</p>
              </div>
              
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Connection status</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">API endpoint</span>
                  <span className="text-sm text-foreground/70 truncate max-w-[200px]">
                    {crmDetails.apiUrl}
                  </span>
                </div>
              </div>
              
              <div className="pt-2">
                <Button className="w-full">
                  Send Data to CRM
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleConnectCRM} className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label htmlFor="apiUrl" className="block text-sm font-medium mb-1">
                    CRM API Endpoint
                  </label>
                  <Input
                    id="apiUrl"
                    placeholder="https://your-crm.com/api"
                    value={crmDetails.apiUrl}
                    onChange={(e) => setCrmDetails(prev => ({ ...prev, apiUrl: e.target.value }))}
                    className="w-full"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="apiKey" className="block text-sm font-medium mb-1">
                    API Key
                  </label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="Your API key"
                    value={crmDetails.apiKey}
                    onChange={(e) => setCrmDetails(prev => ({ ...prev, apiKey: e.target.value }))}
                    className="w-full"
                    required
                  />
                </div>
              </div>
              
              <div className="pt-2">
                <Button type="submit" className="w-full" disabled={!crmDetails.apiUrl || !crmDetails.apiKey}>
                  <ArrowRight className="mr-2 h-4 w-4" /> Connect to CRM
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExportOptions;
