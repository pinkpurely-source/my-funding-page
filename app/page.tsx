"use client";

import React, { useState, useEffect } from 'react';
import AdminPanel from '@/components/AdminPanel';
import { Gift, Contribution } from '@/types';
import { Heart, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabase'; // 방금 만든 supabase 클라이언트 불러오기

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
  }).format(amount);
};

export default function Home() {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. 페이지 접속 시 DB에서 데이터 불러오기
  useEffect(() => {
    fetchGifts();
  }, []);

  const fetchGifts = async () => {
    setLoading(true);
    // 선물 목록과 각 선물의 기부 내역을 함께 가져옵니다.
    const { data, error } = await supabase
      .from('gifts')
      .select(`
        *,
        contributions (*)
      `)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching data:', error);
    } else {
      setGifts(data || []);
    }
    setLoading(false);
  };

  // 2. 새 선물 등록 (DB 저장)
  const addGift = async (newGift: Omit<Gift, 'id' | 'contributions'>) => {
    const { data, error } = await supabase
      .from('gifts')
          .insert([{
      brand: newGift.brand,
      name: newGift.name,
      price: newGift.price,
      image_url: newGift.imageUrl,    // imageUrl을 image_url로 매칭
      product_url: newGift.productUrl // productUrl을 product_url로 매칭
    }])
      .select();

   if (error) {
    // 에러의 세부 내용을 구체적으로 출력합니다.
    console.error('에러 메시지:', error.message);
    console.error('에러 상세:', error.details);
    console.error('에러 힌트:', error.hint);
    alert(`등록 실패: ${error.message}`);
  }
  };

  // 3. 입금 내역 추가 (DB 저장)
  const addFunding = async (giftId: string, amount: number, name: string) => {
    const { error } = await supabase
      .from('contributions')
      .insert([{
        gift_id: giftId,
        amount,
        name,
        date: new Date().toISOString()
      }]);

    if (error) alert('입금 내역 저장 실패!');
    else fetchGifts(); // 목록 새로고침
  };

  // 4. 입금 내역 삭제 (DB 삭제)
  const deleteContributions = async (giftId: string, ids: string[]) => {
    const { error } = await supabase
      .from('contributions')
      .delete()
      .in('id', ids);

    if (error) alert('삭제 실패!');
    else fetchGifts();
  };

  const resetAll = async () => {
    if(confirm("모든 데이터를 초기화하시겠습니까? (DB 데이터가 삭제됩니다)")) {
        const { error } = await supabase.from('gifts').delete().neq('id', '0'); // 전체 삭제 편법
        if (error) alert('초기화 실패');
        else setGifts([]);
    }
  };

  const currentGift = gifts[0];

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold">데이터 불러오는 중...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 text-black">
      {currentGift ? (
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden max-w-4xl w-full flex flex-col md:flex-row">
          <div className="md:w-1/2 bg-gray-100 relative min-h-[400px] flex items-center justify-center">
            <img 
  src={currentGift.image_url} // imageUrl -> image_url 로 변경
  alt={currentGift.name}
  className="object-cover w-full h-full"
  onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400?text=No+Image'; }}
/>
            <a href={currentGift.productUrl} target="_blank" className="absolute bottom-4 left-4 text-xs text-gray-400 flex items-center gap-1 hover:text-black transition-colors">
              <ExternalLink size={12} /> 제품 보러가기
            </a>
          </div>

          <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
            <span className="inline-block bg-black text-white text-[10px] font-bold px-2 py-1 rounded mb-4 w-fit">CURRENT WISH</span>
            <h2 className="text-gray-500 text-sm font-medium mb-1">{currentGift.brand}</h2>
            <h1 className="text-3xl font-bold mb-8 leading-tight">{currentGift.name}</h1>

            <div className="space-y-6 mb-10">
              <div className="flex justify-between items-end">
                <span className="text-gray-400 text-xs font-medium">목표 금액</span>
                <span className="font-bold">{formatCurrency(currentGift.price)}</span>
              </div>

              <div className="relative">
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-black transition-all duration-1000"
                    style={{ width: `${Math.min(100, (currentGift.contributions.reduce((s, c) => s + c.amount, 0) / currentGift.price) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-2xl font-black italic">
                  {((currentGift.contributions.reduce((s, c) => s + c.amount, 0) / currentGift.price) * 100).toFixed(1)}%
                </span>
                <div className="text-right">
                  <span className="block text-[10px] text-gray-400 font-medium">남은 금액</span>
                  <span className="text-red-500 font-bold">
                    {formatCurrency(Math.max(0, currentGift.price - currentGift.contributions.reduce((s, c) => s + c.amount, 0)))}
                  </span>
                </div>
              </div>
            </div>

            <a 
              href="https://aq.gy/f/oBN7g" 
              target="_blank" 
              className="w-full bg-black text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-all active:scale-[0.98]"
            >
              <Heart size={18} fill="currentColor" className="text-pink-500" />
              마음 보내기
            </a>
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-400">등록된 선물이 없습니다. 관리자 모드에서 추가해 주세요.</div>
      )}

      <AdminPanel 
        gifts={gifts}
        onAddGift={addGift}
        onAddFunding={addFunding}
        onDeleteContributions={deleteContributions}
        onReset={resetAll}
        activeGift={gifts[0]}
      />
    </div>
  );
}
