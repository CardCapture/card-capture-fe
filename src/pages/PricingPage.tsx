import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

const PricingPage = () => {
  const navigate = useNavigate();

  const plans = [
    {
      name: 'Starter',
      description: 'For small teams',
      features: [
        'Up to 1,000 cards/month',
        'AI-powered review',
        'Basic export options',
        'Standard support',
      ],
    },
    {
      name: 'Professional',
      description: 'For growing institutions',
      features: [
        'Up to 5,000 cards/month',
        'Advanced AI review',
        'Custom export formats',
        'Priority processing',
        'Priority support',
        'Team collaboration',
      ],
    },
    {
      name: 'Enterprise',
      description: 'For large organizations',
      features: [
        'Unlimited cards',
        'Custom AI training',
        'Dedicated support',
        'API access',
        'Custom integrations',
        'SLA guarantees',
        'On-premise deployment options',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Header Section */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-10 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">Pricing and Licensing</h1>
        <h2 className="text-lg text-muted-foreground mb-8">
          Cardcapture pricing is based on university size and product usage, making Cardcapture an affordable solution for all types of organizations and institutions.
        </h2>
        <Button size="lg" className="mx-auto" onClick={() => navigate('/get-started')}>Request Demo</Button>
      </div>

      {/* Icon Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          <div className="flex flex-col items-center">
            <span className="text-4xl mb-2">💰</span>
            <span className="font-semibold text-lg">Affordable</span>
            <span className="text-muted-foreground text-sm mt-1">Price varies by institution size.</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-4xl mb-2">👥</span>
            <span className="font-semibold text-lg">Unlimited Users</span>
            <span className="text-muted-foreground text-sm mt-1">Equip your team, of any size, with Cardcapture.</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-4xl mb-2">☁️</span>
            <span className="font-semibold text-lg">Web-Based Solution</span>
            <span className="text-muted-foreground text-sm mt-1">No software or hardware required.</span>
          </div>
        </div>
      </div>

      {/* Plan Comparison Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <Card key={plan.name} className="relative flex flex-col">
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <div className="text-muted-foreground mb-2">{plan.description}</div>
              </CardHeader>
              <CardContent className="flex-grow">
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-primary inline-block" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" size="lg" onClick={() => navigate('/get-started')}>
                  Request Demo
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* Onboarding and Support Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 text-center">
        <h1 className="text-3xl font-bold mb-4">Onboarding and Support</h1>
        <h2 className="text-lg text-muted-foreground mb-4">
          All partners receive dedicated implementation support. Cardcapture is an AI-powered solution that improves in accuracy and function as usage increases. Our support team trains the Cardcapture AI model on your specific inquiry cards and data to kickstart your product launch.
        </h2>
      </div>
    </div>
  );
};

export default PricingPage; 