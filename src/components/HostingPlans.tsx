
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { hostingPlans } from '@/data/hostingPlans';
import { cartService } from '@/services/cartService';

export function HostingPlans() {
  const handleAddToCart = (planId: string) => {
    const plan = hostingPlans.find(p => p.id === planId);
    if (plan) {
      cartService.addItem({
        id: plan.id,
        name: plan.name,
        description: plan.description,
        price: plan.price
      });
    }
  };

  return (
    <div className="py-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold">Cloud Hosting Plans</h2>
        <p className="text-muted-foreground">Choose the perfect storage plan for your photos</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        {hostingPlans.map((plan) => (
          <Card key={plan.id} className={`relative ${plan.popular ? 'border-primary shadow-md' : ''}`}>
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full">
                Most Popular
              </div>
            )}
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="mt-4">
                <span className="text-3xl font-bold">${plan.price}</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Storage</span>
                  <span className="font-medium">{plan.storage}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Bandwidth</span>
                  <span className="font-medium">{plan.bandwidth}</span>
                </div>
                <div className="pt-4 space-y-2">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={() => handleAddToCart(plan.id)} 
                className="w-full"
                variant={plan.popular ? "default" : "outline"}
              >
                Add to Cart
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default HostingPlans;
