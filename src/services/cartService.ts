
import { toast } from "sonner";

export interface CartItem {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
}

class CartService {
  private items: CartItem[] = [];
  private listeners: ((items: CartItem[]) => void)[] = [];

  constructor() {
    // Load cart from localStorage if available
    const savedCart = localStorage.getItem('photoStorageCart');
    if (savedCart) {
      try {
        this.items = JSON.parse(savedCart);
      } catch (e) {
        console.error('Failed to parse saved cart', e);
      }
    }
  }

  getItems(): CartItem[] {
    return [...this.items];
  }

  addItem(item: Omit<CartItem, 'quantity'>, quantity: number = 1): void {
    const existingItemIndex = this.items.findIndex(i => i.id === item.id);
    
    if (existingItemIndex >= 0) {
      // Update quantity if item already exists
      this.items[existingItemIndex].quantity += quantity;
      toast.success(`Updated quantity for "${item.name}"`);
    } else {
      // Add new item
      this.items.push({ ...item, quantity });
      toast.success(`Added "${item.name}" to cart`);
    }
    
    this.saveCart();
    this.notifyListeners();
  }

  updateQuantity(itemId: string, quantity: number): void {
    const itemIndex = this.items.findIndex(item => item.id === itemId);
    if (itemIndex >= 0) {
      if (quantity <= 0) {
        this.removeItem(itemId);
      } else {
        this.items[itemIndex].quantity = quantity;
        this.saveCart();
        this.notifyListeners();
      }
    }
  }

  removeItem(itemId: string): void {
    const itemIndex = this.items.findIndex(item => item.id === itemId);
    if (itemIndex >= 0) {
      const removedItem = this.items[itemIndex];
      this.items.splice(itemIndex, 1);
      toast.info(`Removed "${removedItem.name}" from cart`);
      this.saveCart();
      this.notifyListeners();
    }
  }

  clearCart(): void {
    this.items = [];
    toast.info('Cart cleared');
    this.saveCart();
    this.notifyListeners();
  }

  getTotalItems(): number {
    return this.items.reduce((total, item) => total + item.quantity, 0);
  }

  getTotalPrice(): number {
    return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  subscribe(listener: (items: CartItem[]) => void): () => void {
    this.listeners.push(listener);
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener([...this.items]));
  }

  private saveCart(): void {
    localStorage.setItem('photoStorageCart', JSON.stringify(this.items));
  }
}

// Export a singleton instance
export const cartService = new CartService();
