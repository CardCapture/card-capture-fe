import { useEffect } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

const PricingPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const pricingPlans = [
    {
      name: "Starter",
      price: "$3,200",
      period: "per year",
      description: "Perfect for small businesses and startups",
      features: [
        "Up to 1,000 cards per month",
        "AI-powered review",
        "Basic export options",
        "Email support",
        "Standard processing time"
      ],
      cta: "Get Started",
      popular: false
    },
    {
      name: "Professional",
      price: "$3,800",
      period: "per year",
      description: "Ideal for growing businesses",
      features: [
        "Up to 5,000 cards per month",
        "Advanced AI review",
        "Priority processing",
        "Priority support",
        "Custom export formats",
        "Team collaboration"
      ],
      cta: "Get Started",
      popular: true
    },
    {
      name: "Enterprise",
      price: "Contact Us",
      period: "",
      description: "For large organizations with custom needs",
      features: [
        "Unlimited cards",
        "Custom AI training",
        "Dedicated support",
        "API access",
        "Custom integrations",
        "SLA guarantees",
        "On-premise deployment options"
      ],
      cta: "Contact Sales",
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Simple, Transparent Pricing
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Choose the perfect plan for your recruitment needs. All plans include our core features with no hidden fees.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {pricingPlans.map((plan) => (
            <Card 
              key={plan.name}
              className={`relative flex flex-col ${
                plan.popular ? 'border-primary shadow-lg scale-105' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-sm font-medium px-4 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.price !== 'Custom' && <span className="text-muted-foreground">{plan.period}</span>}
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  size="lg"
                  variant={plan.popular ? "default" : "outline"}
                  onClick={() => navigate('/get-started')}
                >
                  {plan.cta}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">What happens if I exceed my monthly card limit?</h3>
            <p className="text-muted-foreground">
              You'll be notified when you're approaching your limit. You can upgrade your plan at any time to accommodate additional cards.
            </p>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Can I change plans later?</h3>
            <p className="text-muted-foreground">
              Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.
            </p>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Do you offer refunds?</h3>
            <p className="text-muted-foreground">
              We offer a 14-day money-back guarantee if you're not satisfied with our service.
            </p>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">What kind of support do you offer?</h3>
            <p className="text-muted-foreground">
              All plans include email support. Professional and Enterprise plans include priority support with faster response times.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage; 