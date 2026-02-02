export interface Contribution {
  id: string;
  amount: number;
  name: string;
  date: string;
}

export interface Gift {
  id: string;
  brand: string;
  name: string;
  price: number;
  image_Url: string;
  product_Url: string;
  contributions: Contribution[];
}

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(amount);
};

export const calculateProgress = (gift: Gift) => {
  const totalFunded = gift.contributions.reduce((sum, c) => sum + c.amount, 0);
  const remaining = Math.max(0, gift.price - totalFunded);
  const percentage = Math.min(100, (totalFunded / gift.price) * 100);
  
  return { totalFunded, remaining, percentage };
};