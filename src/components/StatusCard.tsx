import React from 'react';
import { PostalCodeData } from '../types';
import { ArrowLeft, Clock, MapPin, Sparkles, CheckCircle2, AlertTriangle, AlertCircle, Info } from 'lucide-react';

interface StatusCardProps {
  postalCode: string;
  matches: PostalCodeData[];
  onBack: () => void;
  lastUpdatedTime?: string;
  isRealTimeActive?: boolean;
  isSyncing?: boolean;
}

export const StatusCard: React.FC<StatusCardProps> = ({ 
  postalCode, 
  matches, 
  onBack,
  lastUpdatedTime = "00:00:00",
  isRealTimeActive = false,
  isSyncing = false
}) => {
  
  // Clean checks for remote status: If there's any matching row, it's a remote area
  const isRemoteArea = matches.length > 0;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5 animate-fade-in" id="status-results-scene">
      
      {/* Top Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3" id="status-scene-header">
        <button
          onClick={onBack}
          className="flex items-center justify-start space-x-2 bg-[#db5984] hover:bg-[#c2466f] text-white font-bold py-2 px-4 rounded-xl shadow-sm hover:shadow transition-all text-xs cursor-pointer active:scale-95 text-left self-start"
          id="btn-back-search"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>BACK / ค้นหาใหม่</span>
        </button>
      </div>

      {/* Result Card frame container */}
      <div className="cute-card-frame bg-white overflow-hidden p-6 sm:p-8 relative">
        
        {/* Decorative elements */}
        <div className="absolute top-5 right-6 text-[#eb5e45]/25 font-black text-2xl tracking-widest uppercase font-mono select-none hidden sm:block">
          yomiie system
        </div>

        {/* Checked Postal Code Title */}
        <div className="border-b border-gray-100 pb-5 mb-6 text-left">
          <span className="text-[#eb5e45] font-mono text-[11px] font-bold uppercase tracking-widest leading-none mb-1 block">
            RESULTS CHECKER
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1c2a38] flex flex-wrap items-baseline gap-2">
            <span>รหัสไปรษณีย์:</span>
            <span className="text-[#db5984] wavy-underline font-mono text-3xl">{postalCode}</span>
          </h1>
        </div>

        {/* Large Result Banner Area */}
        {isRemoteArea ? (
          /* Case A: Is Remote Area (+20 Baht Surcharge) */
          <div className="bg-[#fff5f5] border-2 border-[#feb2b2] rounded-[24px] p-5 sm:p-7 text-left space-y-4 animate-fade-in relative overflow-hidden">
            {/* Soft pink highlight glow */}
            <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-48 h-48 rounded-full bg-[#fca5a5]/10 blur-xl pointer-events-none" />

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative z-10">
              <div className="flex items-start gap-3.5">
                <div className="w-14 h-14 rounded-full bg-[#fee2e2] border-2 border-[#fca5a5] flex items-center justify-center text-red-500 shrink-0">
                  <AlertTriangle className="w-8 h-8 text-[#eb5e45]" />
                </div>
                <div className="space-y-1">
                  <strong className="text-[#ea3838] text-lg sm:text-xl font-black font-sans leading-tight block">
                    อยู่ในพื้นที่ห่างไกล 🏔️
                  </strong>
                  <span className="text-xs sm:text-sm text-gray-600 font-semibold leading-relaxed block font-sans">
                    รหัสไปรษณีย์ {postalCode} เป็นจุดพื้นที่เกาะ ดอย หรือชายแดนตามระเบียบขนส่งสินค้า
                  </span>
                </div>
              </div>

              {/* +20 Baht badge capsule */}
              <div className="bg-[#eb5e45] text-white border-2 border-white rounded-[20px] px-6 py-3.5 shadow-lg shadow-red-200/50 flex flex-col items-center justify-center shrink-0 w-full md:w-auto text-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#fecaca] leading-none mb-1">บวกค่าส่งเพิ่ม</span>
                <span className="text-2xl font-black font-mono tracking-tight leading-none">+20 Baht</span>
              </div>
            </div>
          </div>
        ) : (
          /* Case B: Is Normal Delivery Area (0 Baht Surcharge) */
          <div className="bg-[#f0fdf4] border-2 border-[#bbf7d0] rounded-[24px] p-5 sm:p-7 text-left space-y-4 animate-fade-in relative overflow-hidden">
            {/* Soft green highlight glow */}
            <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-48 h-48 rounded-full bg-[#86efac]/10 blur-xl pointer-events-none" />

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative z-10">
              <div className="flex items-start gap-3.5">
                <div className="w-14 h-14 rounded-full bg-[#dcfce7] border-2 border-[#86efac] flex items-center justify-center text-emerald-500 shrink-0">
                  <CheckCircle2 className="w-8 h-8 text-[#10b981]" />
                </div>
                <div className="space-y-1">
                  <strong className="text-[#15803d] text-lg sm:text-xl font-black font-sans leading-tight block">
                    ไม่อยู่ในพื้นที่จัดส่งห่างไกล 🎉
                  </strong>
                  <span className="text-xs sm:text-sm text-gray-600 font-semibold leading-relaxed block font-sans">
                    รหัสไปรษณีย์ {postalCode} เป็นพื้นที่จัดส่งทั่วไปตามเรทมาตรฐาน
                  </span>
                </div>
              </div>

              {/* No charge badge capsule */}
              <div className="bg-[#47a86c] text-white border-2 border-white rounded-[20px] px-6 py-3.5 shadow-lg shadow-green-200/50 flex flex-col items-center justify-center shrink-0 w-full md:w-auto text-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-green-100 leading-none mb-1">ค่าส่งสภาวะปกติ</span>
                <span className="text-xl sm:text-2xl font-black font-sans tracking-tight leading-none">ไม่มีเก็บเพิ่ม</span>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Subdistrict Table Listing matches for transparency */}
        {matches.length > 0 ? (
          <div className="space-y-4 pt-6" id="postal-details-module">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider font-sans flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#eb5e45]" />
                <span>พบเขตพื้นที่ห่างไกลในระบบ ({matches.length} รายการ)</span>
              </h3>
            </div>

            <div className="overflow-x-auto border-2 border-[#f0f2f5] rounded-2xl" id="results-table-scroller">
              <table className="w-full text-left border-collapse bg-white">
                <thead>
                  <tr className="border-b-2 border-[#f0f2f5] bg-gray-50/50">
                    <th className="py-3 px-4 text-[11px] font-black text-[#8898a9] uppercase tracking-wider font-sans text-left">รหัสไปรษณีย์</th>
                    <th className="py-3 px-4 text-[11px] font-black text-[#8898a9] uppercase tracking-wider font-sans text-left">ตำบล</th>
                    <th className="py-3 px-4 text-[11px] font-black text-[#8898a9] uppercase tracking-wider font-sans text-left">จังหวัด</th>
                    <th className="py-3 px-4 text-[11px] font-black text-[#8898a9] uppercase tracking-wider font-sans text-left">พื้นที่</th>
                  </tr>
                </thead>
                <tbody>
                  {matches.map((item, idx) => {
                    const isRowRemote = true;
                    return (
                      <tr 
                        key={idx} 
                        className="border-b border-[#f4f6f8] hover:bg-pink-50/20 transition-colors"
                      >
                        <td className="py-3.5 px-4 text-xs font-bold text-gray-800 font-mono text-left">
                          {item.postalCode}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-semibold text-gray-700 font-sans text-left">
                          {item.subdistrict || "-"}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-medium text-gray-500 font-sans text-left">
                          {item.province || "-"}
                        </td>
                        <td className="py-3.5 px-4 text-left whitespace-nowrap">
                          {isRowRemote ? (
                            <span className="inline-block px-2.5 py-0.5 rounded-lg text-[10.5px] font-bold border border-red-200 bg-red-50 text-red-600 tracking-wide font-sans">
                              {item.area || "-"}
                            </span>
                          ) : (
                            <span className="inline-block px-2.5 py-0.5 rounded-lg text-[10.5px] font-bold border border-green-200 bg-green-50 text-green-600 tracking-wide font-sans">
                              {item.area || "-"}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}



      </div>

    </div>
  );
};
