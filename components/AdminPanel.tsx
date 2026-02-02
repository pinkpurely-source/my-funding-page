"use client";
import React, { useState, useEffect } from 'react';
import { Gift, formatCurrency } from '@/types';
import { Plus, DollarSign, Trash2, Link as LinkIcon, Image as ImageIcon, History, ChevronDown } from 'lucide-react';

interface AdminPanelProps {
  gifts?: Gift[];
  isOpen: boolean;      // 부모로부터 받는 상태
  onClose: () => void;  // 부모로부터 받는 닫기 함수
  onAddGift: (gift: Omit<Gift, 'id' | 'contributions'>) => void;
  onAddFunding: (giftId: string, amount: number, name: string) => void;
  onDeleteContributions: (giftId: string, contributionIds: string[]) => void;
  onReset: () => void;
  activeGift?: Gift;
}

// 1. 여기서 { isOpen, onClose }를 반드시 추가해야 합니다!
export const AdminPanel: React.FC<AdminPanelProps> = ({ 
  gifts = [], 
  isOpen, 
  onClose, 
  onAddGift, 
  onAddFunding, 
  onDeleteContributions, 
  onReset, 
  activeGift 
}) => {
  
  const [selectedGiftId, setSelectedGiftId] = useState<string>('');
  const [brand, setBrand] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [productUrl, setProductUrl] = useState('');
  const [fundingAmount, setFundingAmount] = useState('');
  const [donorName, setDonorName] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (activeGift) {
      setSelectedGiftId(activeGift.id);
    } else if (gifts && gifts.length > 0 && !selectedGiftId) {
      setSelectedGiftId(gifts[0].id);
    }
    // 이제 입구에서 isOpen을 받아왔으므로 여기서 빨간 줄이 사라집니다.
  }, [activeGift, gifts, isOpen, selectedGiftId]);

  const currentGift = (gifts && gifts.find(g => g.id === selectedGiftId)) || (gifts && gifts[0]);

  const handleAddGift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand || !name || !price || !imageUrl) return;
    onAddGift({
      brand,
      name,
      price: parseInt(price.replace(/[^0-9]/g, '')),
      image_url: imageUrl,
      product_url: productUrl
    });
    setBrand(''); setName(''); setPrice(''); setImageUrl(''); setProductUrl('');
  };

  const handleAddFunding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fundingAmount || !currentGift) return;
    const amount = parseInt(fundingAmount.replace(/[^0-9-]/g, ''));
    if (isNaN(amount)) return;
    onAddFunding(currentGift.id, amount, donorName);
    setFundingAmount(''); setDonorName('');
  };

  // 2. 이 부분의 버튼을 '비밀번호 확인용 버튼'으로 바꾸고 싶다면 page.tsx에서 처리하는 것이 좋습니다.
  // 여기서는 단순히 isOpen이 false일 때 아무것도 렌더링하지 않도록 수정합니다.
  if (!isOpen) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] p-6 z-50 max-h-[85vh] overflow-y-auto text-black">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">관리자 패널</h2>
        <div className="flex gap-2">
          <button onClick={onReset} className="text-red-500 text-sm hover:underline px-2">전체 초기화</button>
          <button onClick={onClose} className="text-gray-500 hover:text-black font-bold">닫기</button>
        </div>
      </div>

      {gifts && gifts.length > 0 && (
          <div className="mb-6">
              <label className="block text-xs font-medium text-gray-500 mb-1">편집할 선물 선택</label>
              <div className="relative">
                  <select
                      value={selectedGiftId}
                      onChange={(e) => {
                          setSelectedGiftId(e.target.value);
                          setSelectedIds([]);
                      }}
                      className="w-full appearance-none p-3 border border-gray-300 rounded-lg bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black"
                  >
                      {gifts.map(g => {
                          const isCompleted = g.contributions.reduce((s,c) => s + c.amount, 0) >= g.price;
                          return (
                              <option key={g.id} value={g.id}>
                                  {isCompleted ? '[완료] ' : '[진행중] '} {g.brand} - {g.name}
                              </option>
                          );
                      })}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
              </div>
          </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><DollarSign size={18} />입금 내역 추가</h3>
          {currentGift ? (
            <form onSubmit={handleAddFunding} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">선택된 선물</label>
                <div className="text-sm font-medium">{currentGift.brand} - {currentGift.name}</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                  <input type="text" value={donorName} onChange={(e) => setDonorName(e.target.value)} placeholder="보낸 사람" className="p-2 border border-gray-300 rounded-md text-sm" />
                  <input type="text" value={fundingAmount} onChange={(e) => setFundingAmount(e.target.value)} placeholder="입금액" className="p-2 border border-gray-300 rounded-md text-sm" />
              </div>
              <button type="submit" className="w-full bg-black text-white py-2 rounded-md hover:bg-gray-800">입금 확인</button>
            </form>
          ) : <p className="text-gray-500 text-sm">등록된 선물이 없습니다.</p>}
        </div>

        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><Plus size={18} />새 선물 등록</h3>
          <form onSubmit={handleAddGift} className="space-y-3">
            <input type="text" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="브랜드" className="w-full p-2 border border-gray-300 rounded-md text-sm" />
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="제품명" className="w-full p-2 border border-gray-300 rounded-md text-sm" />
            <input type="text" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="가격" className="w-full p-2 border border-gray-300 rounded-md text-sm" />
            <input type="text" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="이미지 URL" className="w-full p-2 border border-gray-300 rounded-md text-sm" />
            <button type="submit" className="w-full bg-white border border-black text-black py-2 rounded-md hover:bg-gray-50">추가</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;