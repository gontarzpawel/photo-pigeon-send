
import { useState, useEffect } from 'react';
import { ShoppingCart, Trash2, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { cartService, CartItem } from '@/services/cartService';
import { toast } from 'sonner';
import { authService } from '@/services/authService';

export function Cart() {
  const [isOpen, setIsOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isProcessingSubscription, setIsProcessingSubscription] = useState(false);

  useEffect(() => {
    // Initialize cart
    setCartItems(cartService.getItems());
    setTotalItems(cartService.getTotalItems());

    // Subscribe to cart changes
    const unsubscribe = cartService.subscribe((items) => {
      setCartItems(items);
      setTotalItems(cartService.getTotalItems());
    });

    return unsubscribe;
  }, []);

  const handleUpdateQuantity = (itemId: string, delta: number) => {
    const item = cartItems.find(item => item.id === itemId);
    if (item) {
      const newQuantity = Math.max(0, item.quantity + delta);
      cartService.updateQuantity(itemId, newQuantity);
    }
  };

  const handleRemoveItem = (itemId: string) => {
    cartService.removeItem(itemId);
  };

  const handleCheckout = async () => {
    try {
      setIsCheckingOut(true);
      
      // Check if user is logged in
      const isAuthenticated = authService.isLoggedIn();
      if (!isAuthenticated) {
        toast.error("Please login to continue with checkout");
        setIsOpen(false);
        return;
      }
      
      // Get server URL and token
      const serverUrl = authService.getBaseUrl();
      const token = authService.getToken();
      
      if (!serverUrl) {
        toast.error("Server URL not configured");
        setIsCheckingOut(false);
        return;
      }
      
      // Call API to create checkout session
      const response = await fetch(`${serverUrl}/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          items: cartItems.map(item => ({
            id: item.id,
            quantity: item.quantity
          }))
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create checkout session');
      }
      
      const { url } = await response.json();
      
      if (url) {
        // Redirect to Stripe checkout
        window.location.href = url;
      } else {
        throw new Error('No checkout URL returned');
      }
      
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(error instanceof Error ? error.message : 'Checkout failed');
      setIsCheckingOut(false);
    }
  };
  
  const handleSubscribe = async () => {
    try {
      setIsProcessingSubscription(true);
      
      // Check if user is logged in
      const isAuthenticated = authService.isLoggedIn();
      if (!isAuthenticated) {
        toast.error("Please login to continue with subscription");
        setIsOpen(false);
        return;
      }
      
      // Get server URL and token
      const serverUrl = authService.getBaseUrl();
      const token = authService.getToken();
      
      if (!serverUrl) {
        toast.error("Server URL not configured");
        setIsProcessingSubscription(false);
        return;
      }
      
      // Call API to create subscription checkout session
      const response = await fetch(`${serverUrl}/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          items: cartItems.map(item => ({
            id: item.id,
            quantity: item.quantity
          }))
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create subscription');
      }
      
      const { url } = await response.json();
      
      if (url) {
        // Redirect to Stripe subscription checkout
        window.location.href = url;
      } else {
        throw new Error('No subscription URL returned');
      }
      
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error(error instanceof Error ? error.message : 'Subscription failed');
      setIsProcessingSubscription(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative"
          onClick={() => setIsOpen(true)}
        >
          <ShoppingCart className="h-5 w-5" />
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center">
              {totalItems}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Your Cart</DialogTitle>
        </DialogHeader>

        {cartItems.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground">
            Your cart is empty
          </div>
        ) : (
          <div className="space-y-4">
            {cartItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between border-b pb-2">
                <div className="space-y-1">
                  <h3 className="font-medium">{item.name}</h3>
                  <p className="text-sm text-muted-foreground">{formatPrice(item.price)}/month</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center border rounded-md">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-none"
                      onClick={() => handleUpdateQuantity(item.id, -1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-none"
                      onClick={() => handleUpdateQuantity(item.id, 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleRemoveItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            <div className="pt-4">
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>{formatPrice(cartService.getTotalPrice())}/month</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-4">
              <Button 
                onClick={handleSubscribe}
                disabled={isProcessingSubscription || isCheckingOut}
                className="w-full"
              >
                {isProcessingSubscription ? "Processing..." : "Subscribe Monthly"}
              </Button>
              <div className="flex justify-between gap-2">
                <Button variant="outline" onClick={() => cartService.clearCart()} className="flex-1">
                  Clear Cart
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleCheckout}
                  disabled={isCheckingOut || isProcessingSubscription}
                  className="flex-1"
                >
                  One-time Purchase
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default Cart;
