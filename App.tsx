import React, { useState, useEffect } from 'react';
import { Gift, calculateProgress, formatCurrency, Contribution } from './types';
import { ProgressBar } from './components/ProgressBar';
import { AdminPanel } from './components/AdminPanel';
import { Gift as GiftIcon, ExternalLink, Heart } from 'lucide-react';

const INITIAL_GIFTS: Gift[] = [
  {
    id: '1',
    brand: 'BYREDO',
    name: '바이레도 블랑쉬 오드퍼퓸 50ml',
    price: 151250,
    imageUrl: 'https://image.sivillage.com/upload/C00001/s3/goods/org/550/230919005085550.jpg', // Placeholder example
    productUrl: 'https://sivillage.com',
    contributions: []
  }
];

export default function App() {
  const [gifts, setGifts] = useState<Gift[]>(() => {
    const saved = localStorage.getItem('birthday-gifts');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Migration: Ensure contributions are objects
        return parsed.map((g: any) => ({
          ...g,
          contributions: g.contributions.map((c: any) => {
             if (typeof c === 'number') {
               return {
                 id: crypto.randomUUID(),
                 amount: c,
                 name: '기존 후원',
                 date: new Date().toISOString()
               } as Contribution;
             }
             return c;
          })
        }));
      } catch (e) {
        console.error("Failed to load gifts", e);
        return INITIAL_GIFTS;
      }
    }
    return INITIAL_GIFTS;
  });

  useEffect(() => {
    localStorage.setItem('birthday-gifts', JSON.stringify(gifts));
  }, [gifts]);

  // Logic: Find the first gift that is NOT fully funded.
  const activeGiftIndex = gifts.findIndex(g => {
    const total = g.contributions.reduce((sum, c) => sum + c.amount, 0);
    return total < g.price;
  });

  // If activeGiftIndex is -1, it means all gifts are funded.
  const allFunded = activeGiftIndex === -1 && gifts.length > 0;
  const activeGift = activeGiftIndex !== -1 ? gifts[activeGiftIndex] : undefined;

  // Stats for the active gift
  const stats = activeGift ? calculateProgress(activeGift) : { totalFunded: 0, remaining: 0, percentage: 0 };

  const handleAddGift = (newGiftData: Omit<Gift, 'id' | 'contributions'>) => {
    const newGift: Gift = {
      ...newGiftData,
      id: crypto.randomUUID(),
      contributions: [],
    };
    setGifts(prev => [...prev, newGift]);
  };

  const handleAddFunding = (giftId: string, amount: number, name: string) => {
    const newContribution: Contribution = {
      id: crypto.randomUUID(),
      amount,
      name: name.trim() || '익명',
      date: new Date().toISOString()
    };

    setGifts(prev => prev.map(gift => {
      if (gift.id === giftId) {
        return {
          ...gift,
          contributions: [...gift.contributions, newContribution]
        };
      }
      return gift;
    }));
  };

  const handleDeleteContributions = (giftId: string, contributionIds: string[]) => {
    setGifts(prevGifts => prevGifts.map(gift => {
      if (gift.id === giftId) {
        return {
          ...gift,
          contributions: gift.contributions.filter(c => !contributionIds.includes(c.id))
        };
      }
      return gift;
    }));
  };

  const handleReset = () => {
    if (confirm('정말로 모든 데이터를 초기화하시겠습니까?')) {
      setGifts([]);
      localStorage.removeItem('birthday-gifts');
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-6 md:p-12 relative">
      
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-400"></div>

      <main className="w-full max-w-5xl bg-white shadow-2xl rounded-3xl overflow-hidden min-h-[600px] flex flex-col md:flex-row relative">
        
        {gifts.length === 0 ? (
          <div className="w-full flex flex-col items-center justify-center p-20 text-center">
             <GiftIcon size={64} className="text-gray-300 mb-6" />
             <h2 className="text-2xl font-bold text-gray-400">등록된 선물이 없습니다</h2>
             <p className="text-gray-400 mt-2">관리자 모드에서 선물을 추가해주세요.</p>
          </div>
        ) : allFunded ? (
          <div className="w-full flex flex-col items-center justify-center p-20 text-center bg-gradient-to-br from-pink-50 to-white">
             <div className="text-6xl mb-6">🎉</div>
             <h2 className="text-4xl font-bold text-gray-900 mb-4">모든 펀딩이 완료되었습니다!</h2>
             <p className="text-xl text-gray-600">축하해주신 모든 분들께 진심으로 감사드립니다.</p>
          </div>
        ) : activeGift && (
          <>
            {/* Left Side: Image */}
            <div className="w-full md:w-1/2 bg-gray-100 relative group overflow-hidden flex items-center justify-center bg-white border-r border-gray-100">
              <div className="absolute inset-0 bg-gray-50 animate-pulse" />
              <img 
                src={activeGift.imageUrl} 
                alt={activeGift.name}
                className="relative z-10 w-full h-full object-contain p-8 md:p-16 transition-transform duration-700 group-hover:scale-105"
                onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://picsum.photos/800/800?grayscale';
                }}
              />
              {activeGift.productUrl && (
                  <a 
                    href={activeGift.productUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="absolute bottom-4 left-4 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-gray-600 flex items-center gap-1 hover:bg-black hover:text-white transition-colors z-20"
                  >
                    <ExternalLink size={12} /> 제품 보러가기
                  </a>
              )}
            </div>

            {/* Right Side: Details & Funding */}
            <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center">
              
              {/* Header */}
              <div className="mb-12">
                <span className="inline-block px-3 py-1 bg-black text-white text-xs tracking-widest font-bold uppercase rounded-sm mb-4">
                  Current Wish
                </span>
                <h2 className="text-sm font-bold text-gray-500 tracking-widest uppercase mb-2">
                  {activeGift.brand}
                </h2>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
                  {activeGift.name}
                </h1>
              </div>

              {/* Progress Section */}
              <div className="space-y-6 mb-12">
                
                {/* Stats Row */}
                <div className="flex justify-between items-end text-sm md:text-base border-b border-dashed border-gray-200 pb-4">
                  <span className="text-gray-500 font-medium">목표 금액</span>
                  <span className="font-bold font-mono text-gray-900">{formatCurrency(activeGift.price)}</span>
                </div>

                {/* The Bar */}
                <div>
                   <ProgressBar percentage={stats.percentage} />
                   <div className="flex justify-between items-center mt-2">
                      <span className="text-3xl font-black text-black">
                        {stats.percentage.toFixed(1)}%
                      </span>
                      <div className="text-right">
                        <span className="block text-xs text-gray-400 mb-1">남은 금액</span>
                        <span className="block text-xl font-bold font-mono text-red-500">
                          {formatCurrency(stats.remaining)}
                        </span>
                      </div>
                   </div>
                </div>

              </div>

              {/* Call to Action */}
              <div className="mt-auto">
                <a 
                  href="http://aq.gy/f/oBN7g" 
                  target="_blank" 
                  rel="noreferrer"
                  className="group relative w-full flex items-center justify-center gap-3 bg-black text-white py-5 px-8 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-black opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <Heart className="w-6 h-6 text-pink-500 animate-bounce relative z-10" fill="currentColor" />
                  <span className="relative z-10">마음 보내기</span>
                </a>
                <p className="text-center text-xs text-gray-400 mt-4">
                  여러분의 소중한 마음이 모여 선물이 됩니다.
                </p>
              </div>

            </div>
          </>
        )}
      </main>

      {/* Admin Controls */}
      <AdminPanel 
        gifts={gifts} 
        activeGift={activeGift}
        onAddGift={handleAddGift} 
        onAddFunding={handleAddFunding}
        onDeleteContributions={handleDeleteContributions}
        onReset={handleReset}
      />
    </div>
  );
}