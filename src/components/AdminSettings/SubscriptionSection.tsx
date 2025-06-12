import React, { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { SchoolData } from "@/api/supabase/schools";

const PRICING_DISPLAY: Record<string, string> = {
  starter: "$5,000/year",
  professional: "$7,500/year",
  enterprise: "Custom pricing",
};

interface SubscriptionSectionProps {
  school: SchoolData | null;
  schoolLoading: boolean;
  schoolError: Error | null;
  handleStripeCheckout: () => Promise<void>;
}

const SubscriptionSection: React.FC<SubscriptionSectionProps> = ({
  school,
  schoolLoading,
  schoolError,
  handleStripeCheckout,
}) => {
  return (
    <Card className="bg-white shadow-sm rounded-xl p-0">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
          <div>
            <div className="text-2xl font-semibold">Subscription Details</div>
            <div className="text-muted-foreground text-sm mb-4">
              Manage your billing plan and payment details
            </div>
          </div>
        </div>
        <div className="space-y-4">
          {schoolLoading ? (
            <div className="text-muted-foreground text-sm py-8">
              Loading plan details...
            </div>
          ) : schoolError ? (
            <div className="text-red-500 text-sm py-8">
              {schoolError.message || schoolError.toString()}
            </div>
          ) : school ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium capitalize">{school.name} Plan</p>
                </div>
                <Button
                  onClick={handleStripeCheckout}
                  size="default"
                  disabled={schoolLoading || !!schoolError || !school}
                >
                  Manage Subscription
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                You're currently on the{" "}
                <strong className="capitalize">{school.name}</strong> plan,
                billed annually.
              </p>
            </div>
          ) : (
            <div className="text-muted-foreground text-sm py-8">
              No school record found.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default memo(SubscriptionSection);
export { SubscriptionSection };
