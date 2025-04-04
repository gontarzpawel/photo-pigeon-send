
export interface HostingPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  storage: string;
  bandwidth: string;
  features: string[];
  popular?: boolean;
}

export const hostingPlans: HostingPlan[] = [
  {
    id: "basic",
    name: "Basic Storage",
    description: "Perfect for personal photo collections",
    price: 4.99,
    storage: "10 GB",
    bandwidth: "50 GB/month",
    features: [
      "Automatic backup",
      "Web access",
      "Mobile access",
      "Basic support"
    ]
  },
  {
    id: "premium",
    name: "Premium Storage",
    description: "Ideal for photographers",
    price: 9.99,
    storage: "100 GB",
    bandwidth: "200 GB/month",
    features: [
      "Automatic backup",
      "Web access",
      "Mobile access",
      "Priority support",
      "Image optimization",
      "Custom domain"
    ],
    popular: true
  },
  {
    id: "professional",
    name: "Professional Storage",
    description: "For serious photo collections",
    price: 19.99,
    storage: "500 GB",
    bandwidth: "1 TB/month",
    features: [
      "Automatic backup",
      "Web access",
      "Mobile access",
      "24/7 support",
      "Image optimization",
      "Custom domain",
      "API access",
      "Collaborative albums"
    ]
  }
]
