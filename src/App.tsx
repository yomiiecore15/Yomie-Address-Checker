import { useState, useEffect } from 'react';
import { SheetConfig, PostalCodeData } from './types';
import { Header } from './components/Header';
import { SearchBox } from './components/SearchBox';
import { StatusCard } from './components/StatusCard';
import { AdminPanel } from './components/AdminPanel';
import { PasscodeModal } from './components/PasscodeModal';
import { 
  INITIAL_CONFIG, SAMPLE_POSTAL_CODES, buildQueryUrl, parsePostalCodeGvizData 
} from './sampleData';
import { AlertCircle, ShieldAlert } from 'lucide-react';

export default function App() {
  const [config, setConfig] = useState<SheetConfig>(INITIAL_CONFIG);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('yomie_admin_authenticated') === 'true';
  });
  const [isPasscodeOpen, setIsPasscodeOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState("00:00:00");
  
  // Matched postal code items for inspector
  const [matchedRows, setMatchedRows] = useState<PostalCodeData[]>([]);

  // Update clocks on demand
  const refreshUpdateTime = () => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    setLastUpdated(`${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`);
  };

  // Set initial clock
  useEffect(() => {
    refreshUpdateTime();
  }, []);

  // Load configuration from local storage on startup
  useEffect(() => {
    const saved = localStorage.getItem('yomie_postal_config_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setConfig(parsed);
      } catch (e) {
        console.error('Failed to parse saved config.', e);
        setConfig(INITIAL_CONFIG);
      }
    } else {
      setConfig(INITIAL_CONFIG);
      localStorage.setItem('yomie_postal_config_v2', JSON.stringify(INITIAL_CONFIG));
    }
  }, []);

  const handleSaveConfig = (newConfig: SheetConfig) => {
    setConfig(newConfig);
    localStorage.setItem('yomie_postal_config_v2', JSON.stringify(newConfig));
    handleClear();
  };

  const handleResetToDemo = () => {
    setConfig(INITIAL_CONFIG);
    localStorage.removeItem('yomie_postal_config_v2');
    handleClear();
  };

  const handleClear = () => {
    setSearchQuery('');
    setMatchedRows([]);
    setErrorText(null);
  };

  const handleOpenSettings = () => {
    if (isAdminAuthenticated) {
      setIsSettingsOpen(true);
    } else {
      setIsPasscodeOpen(true);
    }
  };

  const handleLogout = () => {
    setIsAdminAuthenticated(false);
    sessionStorage.removeItem('yomie_admin_authenticated');
    setIsSettingsOpen(false);
  };

  const handleRefresh = () => {
    refreshUpdateTime();
    if (searchQuery) {
      handleSearch(searchQuery);
    } else {
      // Small bounce scale animation on brand text
      const infoSpan = document.getElementById("brand-yomie-text");
      if (infoSpan) {
        infoSpan.classList.add("scale-105");
        setTimeout(() => infoSpan.classList.remove("scale-105"), 300);
      }
    }
  };

  const handleSearch = async (query: string) => {
    const cleanQuery = query.trim();
    if (cleanQuery.length !== 5) return;

    setSearchQuery(cleanQuery);
    setErrorText(null);
    setMatchedRows([]);
    setIsLoading(true);
    refreshUpdateTime();

    if (config.useFallbackSample) {
      // Simulate lookup delay for cute feel
      setTimeout(() => {
        const matches = SAMPLE_POSTAL_CODES.filter(item => item.postalCode === cleanQuery);
        setMatchedRows(matches);
        setIsLoading(false);
      }, 700);
    } else {
      // Real-time remote spreadsheets fetch lookup
      try {
        const queryUrl = buildQueryUrl(config.spreadsheetId, config.sheetName, config.spreadsheetUrl);
        const res = await fetch(queryUrl);
        if (!res.ok) {
          throw new Error(`Google Sheets endpoint error. Status Code: ${res.status}`);
        }
        const text = await res.text();
        const allRows = parsePostalCodeGvizData(text);
        
        // Exact match for the 5-digit postal code
        const matches = allRows.filter(item => item.postalCode === cleanQuery);
        
        setMatchedRows(matches);
      } catch (err: any) {
        console.error(err);
        setErrorText(
          "ไม่สามารถดึงข้อมูลจาก Google Sheets ได้ กรุณาตรวจสอบให้แน่ใจว่าได้เปิดสิทธิ์การแชร์ไฟล์เป็น 'ทุกคนที่มีลิงก์ดูได้' และตั้งชื่อชีตถูกต้องในหน้าตั้งค่าข้อมูลของร้านนะคะ"
        );
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen stripes-bg flex flex-col font-sans text-gray-900 selection:bg-pink-100 selection:text-pink-900 pb-16" id="app-root-layout">
      
      {/* Decorative absolute sparkly stars around on striped canvas background */}
      <div className="absolute top-[180px] left-[8%] animate-sparkle text-yellow-300 opacity-60 hidden lg:block pointer-events-none">
        <svg className="w-9 h-9 fill-[#f9ca3e]" viewBox="0 0 24 24">
          <path d="M12 2l2.4 7.2L22 11.6l-5.6 5.4 1.8 7.5L12 20.2l-6.2 4.3 1.8-7.5-5.6-5.4 7.6-2.4z" />
        </svg>
      </div>
      <div className="absolute top-[320px] right-[7%] animate-sparkle text-yellow-300 opacity-75 hidden lg:block pointer-events-none" style={{ animationDelay: "2s" }}>
        <svg className="w-11 h-11 fill-[#ebd57d]" viewBox="0 0 24 24">
          <path d="M12 2l2.4 7.2L22 11.6l-5.6 5.4 1.8 7.5L12 20.2l-6.2 4.3 1.8-7.5-5.6-5.4 7.6-2.4z" />
        </svg>
      </div>
      <div className="absolute bottom-[200px] left-[5%] animate-sparkle text-yellow-300 opacity-50 hidden lg:block pointer-events-none" style={{ animationDelay: "1s" }}>
        <svg className="w-7 h-7 fill-[#f9ca3e]" viewBox="0 0 24 24">
          <path d="M12 2l2.4 7.2L22 11.6l-5.6 5.4 1.8 7.5L12 20.2l-6.2 4.3 1.8-7.5-5.6-5.4 7.6-2.4z" />
        </svg>
      </div>

      {/* Header bar component */}
      <Header 
        isConfigured={config.isConfigured} 
        onOpenSettings={handleOpenSettings} 
        onRefresh={handleRefresh}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 md:px-8 pt-6 pb-12 flex flex-col justify-center">
        
        {/* Search view panel */}
        {!searchQuery && !isLoading && (
          <div className="space-y-6 pt-5 animate-fade-in" id="search-view-panel">
            <SearchBox 
              onSearch={handleSearch} 
              isLoading={isLoading} 
              onClear={handleClear}
            />
          </div>
        )}

        {/* Loading Spinner */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16 space-y-4 animate-fade-in" id="loading-panel">
            <div className="relative">
              <div className="w-14 h-14 border-4 border-pink-100 rounded-full"></div>
              <div className="absolute top-0 w-14 h-14 border-4 border-[#eb5e45] border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-sm text-gray-500 font-bold font-sans">กำลังดึงข้อมูลและเชื่อมโยงระบบฐานข้อมูล...</p>
          </div>
        )}

        {/* Fetch errors */}
        {!isLoading && errorText && (
          <div className="max-w-2xl mx-auto bg-red-50 border-2 border-red-200 text-red-800 p-5 rounded-3xl flex items-start space-x-3.5 shadow-sm mt-5 text-left animate-fade-in" id="error-box">
            <AlertCircle className="w-6 h-6 text-[#eb5e45] flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-sm">ตรวจสอบฐานข้อมูลขัดข้อง</h4>
              <p className="text-xs text-red-700 leading-relaxed font-sans">{errorText}</p>
              {isAdminAuthenticated && (
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="mt-2 text-xs text-[#eb5e45] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                >
                  เปิดหน้าร้านค้าควบคุม เพื่อแก้ไขข้อมูลเชื่อมโยง →
                </button>
              )}
            </div>
          </div>
        )}

        {/* Results Screen */}
        {!isLoading && !errorText && searchQuery && (
          <div className="pt-2">
            <StatusCard 
              postalCode={searchQuery}
              matches={matchedRows}
              onBack={handleClear}
              lastUpdatedTime={lastUpdated}
              isRealTimeActive={!config.useFallbackSample}
            />
          </div>
        )}

      </main>

      {/* Admin Panel Sliding Settings component */}
      <AdminPanel 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        config={config} 
        onSaveConfig={handleSaveConfig} 
        onResetToDemo={handleResetToDemo} 
        onLogout={handleLogout}
      />

      {/* Admin Verification Modal component */}
      <PasscodeModal
        isOpen={isPasscodeOpen}
        onClose={() => setIsPasscodeOpen(false)}
        onSuccess={() => {
          setIsPasscodeOpen(false);
          setIsAdminAuthenticated(true);
          sessionStorage.setItem('yomie_admin_authenticated', 'true');
          setIsSettingsOpen(true);
        }}
      />

    </div>
  );
}
