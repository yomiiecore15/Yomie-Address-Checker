import React, { useState, useEffect } from 'react';
import { SheetConfig, PostalCodeData, AuditIssue } from '../types';
import { 
  X, FileSpreadsheet, Sparkles, RefreshCw, 
  Settings2, Copy, AlertTriangle, CheckCircle2,
  ShieldAlert, Info, AlertCircle, ChevronDown, ChevronUp, ClipboardList
} from 'lucide-react';
import { extractSpreadsheetId, buildQueryUrl, parsePostalCodeGvizData, SAMPLE_POSTAL_CODES } from '../sampleData';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  config: SheetConfig;
  onSaveConfig: (newConfig: SheetConfig) => void;
  onResetToDemo: () => void;
  onLogout?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onResetToDemo,
  onLogout,
}) => {
  const [urlInput, setUrlInput] = useState(config.spreadsheetUrl);
  const [sheetNameInput, setSheetNameInput] = useState(config.sheetName);
  
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; rowsCount?: number } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Column A:A Auditor Integrity state selectors
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<{ totalRows: number; issues: AuditIssue[]; passedCount: number } | null>(null);
  const [activeAuditTab, setActiveAuditTab] = useState<'all' | 'errors' | 'warnings_infos'>('all');
  const [copiedIssuesText, setCopiedIssuesText] = useState(false);

  const TEMPLATE_SHEET_URL = "https://docs.google.com/spreadsheets/d/14JxSbYeA2n3QATSd9BgiCQeWdh9Rv0mbCZP-vkuMZyE/edit";

  useEffect(() => {
    setUrlInput(config.spreadsheetUrl);
    setSheetNameInput(config.sheetName || "");
    setTestResult(null);
    setAuditResult(null);
  }, [config, isOpen]);

  if (!isOpen) return null;

  const runValidation = (rows: PostalCodeData[]) => {
    const issues: AuditIssue[] = [];
    
    rows.forEach((row, index) => {
      const rowNum = index + 2; // spreadsheet visual data row index
      const code = (row.postalCode || "").trim();
      const sub = (row.subdistrict || "").trim();
      const prov = (row.province || "").trim();
      const area = (row.area || "").trim();
      const areaL = area.toLowerCase();

      // 1. Check postal code
      if (!code) {
        issues.push({
          rowNum,
          postalCode: "(ไม่มีข้อมูล)",
          subdistrict: sub,
          province: prov,
          areaVal: area,
          type: 'error',
          message: "ข้อมูลรหัสไปรษณีย์ในคอลัมน์ A เป็นค่าว่างเปล่า",
          suggestion: "โปรดระบุรหัสไปรษณีย์ 5 หลักใน Google Sheets แถวนี้"
        });
        return;
      }

      if (code.length !== 5 || !/^\d+$/.test(code)) {
        issues.push({
          rowNum,
          postalCode: code,
          subdistrict: sub,
          province: prov,
          areaVal: area,
          type: 'error',
          message: `รูปแบบรหัสไปรษณีย์ '${code}' ไม่ถูกต้อง (ต้องใช้ตัวเลข 5 หลัก)`,
          suggestion: "แก้ไขข้อมูลรหัสในคอลัมน์ A ให้เป็นตัวเลขคำรวบยอด 5 หลักที่ถูกต้อง"
        });
      }

      // 2. Check area remote status
      const isRemote = areaL.includes("ห่างไกล") || 
                      areaL.includes("พิเศษ") || 
                      areaL.includes("เกาะ") || 
                      areaL.includes("ดอย") || 
                      areaL.includes("ชายแดน") || 
                      areaL.includes("remote") ||
                      areaL.includes("20");

      if (!isRemote) {
        if (areaL === "" || areaL === "ปกติ") {
          issues.push({
            rowNum,
            postalCode: code,
            subdistrict: sub,
            province: prov,
            areaVal: area || "(สถานะปกติ/ว่าง)",
            type: 'warning',
            message: `ป้อนรหัสพื้นที่ไม่ใช่เขตห่างไกล (ได้รับข้อมูลเป็น: '${area || 'ปล่อยว่าง'}')`,
            suggestion: "ระบุข้อความเป็น 'พื้นที่ห่างไกล' ในคอลัมน์ D เพื่อประเมินค่าเพิ่ม หรือตัดแถวออกหากพึงประสงค์เป็นปกติ"
          });
        } else {
          issues.push({
            rowNum,
            postalCode: code,
            subdistrict: sub,
            province: prov,
            areaVal: area,
            type: 'warning',
            message: `ข้อความระบุด้านพื้นที่ '${area}' ในคอลัมน์ D ขัดกับคำจำแนกของระบบที่รองรับ`,
            suggestion: "โปรดป้อนคำว่า 'พื้นที่ห่างไกล' เพื่อความแน่นอนในการจำแนก"
          });
        }
      }

      // 3. Minor warnings for quality helper data
      if (isRemote && !sub) {
        issues.push({
          rowNum,
          postalCode: code,
          subdistrict: "(ว่าง)",
          province: prov,
          areaVal: area,
          type: 'info',
          message: "คอลัมน์ B (ตำบล / อำเภอ) โดนปล่อยว่างไว้",
          suggestion: "ควรกรอกระบุตัวตนตำบล/อำเภอเพื่อชี้แจงพื้นที่จัดส่งอย่างละเมียดละไม"
        });
      }

      if (isRemote && !prov) {
        issues.push({
          rowNum,
          postalCode: code,
          subdistrict: sub,
          province: "(ว่าง)",
          areaVal: area,
          type: 'info',
          message: "คอลัมน์ C (จังหวัด) โดนปล่อยว่างไว้",
          suggestion: "ควรกรอกระบุตัวตนชื่อจังหวัดปลายทางร่วมด้วยเพื่อการตรวจสอบที่ง่ายที่สุด"
        });
      }
    });

    const problematicRowNums = new Set(
      issues.filter(i => i.type === 'error' || i.type === 'warning').map(i => i.rowNum)
    );
    const passedCount = rows.length - problematicRowNums.size;

    setAuditResult({
      totalRows: rows.length,
      issues,
      passedCount: Math.max(0, passedCount)
    });
  };

  const triggerManualAudit = async (useDemo: boolean = false) => {
    setIsAuditing(true);
    setAuditResult(null);
    
    // Use fallback sample representation if configured or requested
    if (useDemo || !urlInput.trim() || config.useFallbackSample) {
      setTimeout(() => {
        runValidation(SAMPLE_POSTAL_CODES);
        setIsAuditing(false);
      }, 600);
      return;
    }

    const spreadsheetId = extractSpreadsheetId(urlInput);
    if (!spreadsheetId) {
      setAuditResult({
        totalRows: 0,
        issues: [{
          rowNum: 1,
          postalCode: "ผิดพลาด",
          subdistrict: "",
          province: "",
          areaVal: "",
          type: 'error',
          message: "ที่อยู่ลิงก์ Google Sheets ขัดแย้งรูปแบบสากล",
          suggestion: "ตรวจสอบป้อนคัดลอกลิงก์ไฟล์ Google Sheet ตารางปลายทางของท่านให้มีตีย์ไอดีครบถ้วน"
        }],
        passedCount: 0
      });
      setIsAuditing(false);
      return;
    }

    try {
      const queryUrl = buildQueryUrl(spreadsheetId, sheetNameInput, urlInput);
      const response = await fetch(queryUrl);
      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}`);
      }
      const text = await response.text();
      const parsedRows = parsePostalCodeGvizData(text);
      runValidation(parsedRows);
    } catch (err: any) {
      console.error(err);
      setAuditResult({
        totalRows: 0,
        issues: [{
          rowNum: 1,
          postalCode: "ล้มเหลว",
          subdistrict: "",
          province: "",
          areaVal: "",
          type: 'error',
          message: "ดึงข้อมูลโครงแผ่นตารางผ่าน API สาธารณะขัดข้อง",
          suggestion: "โปรดมั่นใจว่าแผ่นงานโดนปลดล็อกเป็น 'ทุกคนที่มีลิงก์มีสิทธิ์ดู' และตั้งชื่อชีตถูกต้อง"
        }],
        passedCount: 0
      });
    } finally {
      setIsAuditing(false);
    }
  };

  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(TEMPLATE_SHEET_URL);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    
    const spreadsheetId = extractSpreadsheetId(urlInput);
    if (!spreadsheetId) {
      setTestResult({ success: false, message: "❌ รูปแบบลิงก์ Google Sheets ไม่ถูกต้อง กรุณาตรวจสอบลิงก์อีกครั้งนะคะ" });
      setIsTesting(false);
      return;
    }

    try {
      const queryUrl = buildQueryUrl(spreadsheetId, sheetNameInput, urlInput);
      const response = await fetch(queryUrl);
      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}`);
      }
      const text = await response.text();
      const parsedRows = parsePostalCodeGvizData(text);
      setTestResult({
        success: true,
        message: `✅ เชื่อมต่อสำเร็จ! สมบูรณ์แบบ`,
        rowsCount: parsedRows.length
      });
      // Automatically run Column A:A remote audit on test success
      runValidation(parsedRows);
    } catch (err: any) {
      console.error(err);
      setTestResult({
        success: false,
        message: `❌ เชื่อมต่อล้มเหลว: โปรดตรวจสอบว่าได้เปิดสิทธิ์ไฟล์เป็น 'ทุกคนที่มีลิงก์มีสิทธิ์อ่าน' และพิมพ์ชื่อแผ่นงานถูกต้อง`
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    const spreadsheetId = extractSpreadsheetId(urlInput) || "";
    
    onSaveConfig({
      spreadsheetUrl: urlInput.trim(),
      spreadsheetId,
      sheetName: sheetNameInput.trim(),
      isConfigured: !!spreadsheetId,
      useFallbackSample: !spreadsheetId,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end" id="admin-panel-overlay">
      {/* Backdrop overlay */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-xs transition-opacity animate-fade-in" 
      />

      {/* Sliding Drawer Container */}
      <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col z-10 animate-slide-in" id="admin-panel-drawer">
        
        {/* Drawer Header */}
        <div className="px-6 py-5 border-b border-[#f0f2f5] flex items-center justify-between bg-gray-50">
          <div className="flex items-center space-x-2">
            <Settings2 className="w-5 h-5 text-[#eb5e45]" />
            <h3 className="text-base font-bold text-gray-900 tracking-tight font-sans">
              การตั้งค่าฐานข้อมูลไปรษณีย์
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 px-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scroll Container */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          
          {/* Instruction helper */}
          <div className="bg-[#fef9f7] border border-[#fbebeb] rounded-xl p-4.5 space-y-3 text-left">
            <h4 className="text-xs font-bold text-[#eb5e45] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              ข้อกำหนดโครงสร้างตารางข้อมูล
            </h4>
            <p className="text-xs text-gray-650 leading-relaxed font-sans">
              ระบบเช็คดัชนีไปรษณีย์กำหนดให้แผ่นตาราง Google Sheet ปลายทางหลักมีคอลัมน์คงที่ดังนี้:<br />
              • <strong className="text-red-500 font-mono">คอลัมน์ A (A:A)</strong> - รหัสไปรษณีย์ 5 หลัก<br />
              • <strong className="text-red-500 font-mono">คอลัมน์ B (B:B)</strong> - ตำบล / อำเภอ<br />
              • <strong className="text-red-500 font-mono">คอลัมน์ C (C:C)</strong> - จังหวัด<br />
              • <strong className="text-red-500 font-mono">คอลัมน์ D (D:D)</strong> - พื้นที่ (คำที่ระบุว่า "พื้นที่ห่างไกล" จะโดนบวกเพิ่ม 20 บาท)<br />
            </p>
            <p className="text-xs text-gray-500 font-sans font-semibold pt-1">
              ⚠️ สำคัญมาก: โปรดแชร์ไฟล์ Google Sheet แบบสาธารณะ <strong>"ผู้ที่มีลิงก์มีสิทธิ์อ่าน" (Anyone with link can view)</strong> เพื่อให้ระบบดึงข้อมูลได้ทันทีค่ะ
            </p>
            
            <div className="pt-2.5 border-t border-red-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-left">
              <a 
                href={TEMPLATE_SHEET_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#eb5e45] hover:underline font-bold"
              >
                เปิดดูไฟล์ Google Sheet ปัจจุบันของร้าน →
              </a>
              <button
                onClick={handleCopyTemplate}
                className="px-2.5 py-1 text-[10px] bg-white border border-[#fcceca] text-[#eb5e45] hover:bg-red-50 rounded-lg font-semibold transition flex items-center gap-1 self-start sm:self-auto cursor-pointer"
              >
                <Copy className="w-3 h-3" />
                <span>{copiedLink ? "คัดลอกสำเร็จ!" : "คัดลอกลิงก์ชีต"}</span>
              </button>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4 text-left">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 block">ลิงก์ Google Sheets (Spreadsheet Link)</label>
              <input
                type="text"
                placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="w-full text-xs p-3 border border-gray-200 focus:border-[#eb5e45] focus:ring-1 focus:ring-[#fbebeb] rounded-xl text-gray-900 font-sans"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 block">ชื่อแท็บแผ่นงานย่อย (เช่น Sheet1, แผ่น1 หรือว่างไว้เพื่อใช้แท็บแรกสุด)</label>
              <input
                type="text"
                placeholder="ปล่อยว่าง หรือป้อนชื่อแท็บ เช่น Sheet1"
                value={sheetNameInput}
                onChange={(e) => setSheetNameInput(e.target.value)}
                className="w-full text-xs p-3 border border-gray-200 focus:border-[#eb5e45] focus:ring-1 focus:ring-[#fbebeb] rounded-xl text-gray-900 font-mono"
              />
            </div>
          </div>

          {/* Connection Trigger Buttons */}
          <div className="pt-1 text-left">
            <button
              onClick={handleTestConnection}
              disabled={isTesting || !urlInput.trim()}
              className="w-full bg-[#eb5e45]/5 hover:bg-[#eb5e45]/10 border border-[#fddbd4] text-[#eb5e45] disabled:opacity-40 text-xs py-3 rounded-xl font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#eb5e45] ${isTesting ? 'animate-spin' : ''}`} />
              <span>ทดสอบเชื่อมต่อ & ดึงข้อมูลรหัสล่าสุด</span>
            </button>
          </div>

          {/* Result Status Message */}
          {testResult && (
            <div className={`p-4 rounded-xl border text-xs leading-relaxed font-sans text-left ${
              testResult.success ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <div className="flex items-center gap-1.5 font-bold mb-1">
                {testResult.success ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <AlertTriangle className="w-4 h-4 text-red-500" />}
                <span>{testResult.message}</span>
              </div>
              {testResult.success && testResult.rowsCount !== undefined && (
                <span className="font-bold block text-green-700 pl-5">
                  ดึงเข้าคลังข้อมูลรหัสไปรษณีย์สำเร็จ: {testResult.rowsCount} รายการในฐานแผ่นงาน!
                </span>
              )}
            </div>
          )}

          {/* Column A:A Deep Integrity Auditor Tool */}
          <div className="border-t border-[#f0f2f5] pt-5 space-y-4 text-left" id="postal-audit-module">
            <div className="flex flex-col space-y-1 text-left">
              <span className="text-[10px] font-black text-[#eb5e45] tracking-widest uppercase font-mono block">
                DATABASE SANITY AND SECURITY
              </span>
              <h4 className="text-sm font-bold text-gray-900 tracking-tight font-sans">
                🛡️ ผู้ช่วยเช็คสุขภาพและตรวจสอบความปลอดภัยแถว A:A
              </h4>
              <p className="text-[11px] text-gray-500 leading-relaxed font-sans mt-0.5">
                ประเมินความถูกต้องของรหัสไปรษณีย์ทุกแถวในไฟล์ของคุณ เพื่อให้มั่นใจว่าเป็นพื้นที่จัดส่งห่างไกลจริงและครอบคลุมการบวกคิดค่าส่งเพิ่ม 20 บาทครบถ้วน 100%
              </p>
            </div>

            {/* Quick Audit Triggers / Status */}
            {!isAuditing && !auditResult && (
              <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl flex flex-col items-stretch gap-2.5">
                <span className="text-[11px] font-semibold text-gray-500 leading-normal font-sans">
                  💡 แนะนำเริ่มการสแกนเพื่อตรวจสอบหาจุดผิดปรกติ แถวว่าง หรือรหัสไปรษณีย์ที่พิมพ์ผิดพลาดไม่ครบ 5 หลักที่ปะปนเข้ามาในระบบค่ะ
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => triggerManualAudit(false)}
                    className="flex-1 bg-[#db5984] hover:bg-[#c4406a] text-white text-[11px] py-2 px-3 rounded-lg font-bold transition flex items-center justify-center gap-1 cursor-pointer shadow-xs active:translate-y-0.5"
                  >
                    🔍 สแกนตารางชีตปัจจุบัน
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerManualAudit(true)}
                    className="bg-white hover:bg-gray-100 border border-gray-250 text-gray-650 hover:text-gray-800 text-[11px] py-1.5 px-2.5 rounded-lg font-bold transition cursor-pointer"
                  >
                    ตรวจรหัสตัวอย่าง Demo
                  </button>
                </div>
              </div>
            )}

            {isAuditing && (
              <div className="p-6 bg-[#fffbf9] border border-[#fddbd4] rounded-2xl flex flex-col items-center justify-center space-y-2 animate-pulse">
                <div className="w-8 h-8 rounded-full border-2 border-[#eb5e45] border-t-transparent animate-spin" />
                <span className="text-[11px] text-[#eb5e45] font-bold font-sans">กำลังเปิดสแกนประเมินวิเคราะห์คอลัมน์แถว A:A ในแผ่นตาราง Google...</span>
              </div>
            )}

            {/* Audit Results View Panel */}
            {!isAuditing && auditResult && (
              <div className="space-y-4" id="audit-results-block">
                
                {/* Metric Summary Card Layout */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-gray-50 border border-gray-150 rounded-xl space-y-0.5 text-left">
                    <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-wide font-sans">ความสะอาดของข้อมูล (A:A)</span>
                    <span className={`text-lg sm:text-xl font-black font-mono leading-none block ${
                      auditResult.issues.filter(i => i.type === 'error' || i.type === 'warning').length === 0 ? 'text-green-600' : 'text-amber-500'
                    }`}>
                      {Math.round((auditResult.passedCount / (auditResult.totalRows || 1)) * 100)}%
                    </span>
                    <span className="text-[10px] text-gray-500 font-bold block pt-0.5">
                      ผ่านเกณฑ์ {auditResult.passedCount} / {auditResult.totalRows} แถว
                    </span>
                  </div>

                  <div className="p-3 bg-[#fff9fa] border border-[#fcdce3] rounded-xl space-y-0.5 text-left">
                    <span className="text-[10px] font-bold text-[#db5984] block uppercase tracking-wide font-sans">พบประเด็นที่ต้องเช็ค</span>
                    <span className={`text-lg sm:text-xl font-black font-mono leading-none block ${
                      auditResult.issues.filter(i => i.type === 'error' || i.type === 'warning').length > 0 ? 'text-[#eb5e45]' : 'text-emerald-600'
                    }`}>
                      {auditResult.issues.filter(i => i.type === 'error' || i.type === 'warning').length} รายการ
                    </span>
                    <span className="text-[10px] text-gray-500 font-bold block pt-0.5">
                      ผิดพลาดรุนแรง: {auditResult.issues.filter(i => i.type === 'error').length} รายการ
                    </span>
                  </div>
                </div>

                {/* Overall Verdict Banner */}
                {auditResult.issues.filter(i => i.type === 'error' || i.type === 'warning').length === 0 ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-150 rounded-xl flex items-start gap-2 text-left">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5 font-sans text-left">
                      <strong className="text-xs text-emerald-850 font-bold block">
                        ภาพรวมผ่านเกณฑ์สมบูรณ์แบบ 100%! 🎉
                      </strong>
                      <span className="text-[10px] text-emerald-700 leading-normal font-semibold block">
                        รหัสไปรษณีย์ทั้งหมดในแถว A:A เป็นเขตพื้นที่ห่างไกลอย่างถูกต้อง มั่นใจได้ว่าการตรวจสอบบวกส่วนต่าง +20 บาท ปลอดภัยและทำงานได้อย่างสูงสุดค่ะ!
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-left">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div className="space-y-0.5 font-sans text-left">
                      <strong className="text-xs text-amber-850 font-bold block">
                        ⚠️ พบจุดที่ควรตรวจสอบและแก้ไขในตาราง
                      </strong>
                      <span className="text-[10px] text-amber-700 leading-normal font-semibold block">
                        ตรวจเจอรหัสไปรษณีย์ที่จัดอยู่ในสถานะ "ปกติ" หรือขาดคำสำคัญห่างไกลในช่องคอลัมน์ D ซึ่งอาจทำให้ระบบประเมินค่าจัดส่งเป็นราคาธรรมดาโดยไม่ได้บวก 20 บาทค่ะ
                      </span>
                    </div>
                  </div>
                )}

                {/* Auditor Tabs and issue lists */}
                <div className="space-y-2">
                  <div className="flex gap-1 border-b border-gray-150 pb-1 justify-start">
                    <button
                      type="button"
                      onClick={() => setActiveAuditTab('all')}
                      className={`px-2 py-0.5 text-xs rounded-lg font-bold transition cursor-pointer ${
                        activeAuditTab === 'all' ? 'bg-[#eb5e45] text-white' : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      ทั้งหมด ({auditResult.issues.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveAuditTab('errors')}
                      className={`px-2 py-0.5 text-xs rounded-lg font-bold transition cursor-pointer ${
                        activeAuditTab === 'errors' ? 'bg-red-500 text-white' : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      ข้อผิดพลาด ({auditResult.issues.filter(i => i.type === 'error').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveAuditTab('warnings_infos')}
                      className={`px-2 py-0.5 text-xs rounded-lg font-bold transition cursor-pointer ${
                        activeAuditTab === 'warnings_infos' ? 'bg-amber-400 text-white' : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      คำแนะนำ ({auditResult.issues.filter(i => i.type === 'warning' || i.type === 'info').length})
                    </button>
                  </div>

                  {/* Rendering specific list filtered */}
                  <div className="max-h-52 overflow-y-auto space-y-2 border border-gray-100 rounded-xl p-1.5 bg-gray-50/50" id="audit-list-scroller">
                    {auditResult.issues.filter(itm => {
                      if (activeAuditTab === 'errors') return itm.type === 'error';
                      if (activeAuditTab === 'warnings_infos') return itm.type === 'warning' || itm.type === 'info';
                      return true;
                    }).length === 0 ? (
                      <div className="py-6 text-center text-gray-400 text-[11px] font-bold">
                        ✨ ยอดเยี่ยมมาก ไม่พบข้อบกพร่องตามหมวดหมู่ตัวกรองนี้!
                      </div>
                    ) : (
                      auditResult.issues
                        .filter(itm => {
                          if (activeAuditTab === 'errors') return itm.type === 'error';
                          if (activeAuditTab === 'warnings_infos') return itm.type === 'warning' || itm.type === 'info';
                          return true;
                        })
                        .map((itm, index) => (
                          <div 
                            key={index} 
                            className={`p-2.5 rounded-xl text-left text-[11px] leading-relaxed border space-y-1 font-sans ${
                              itm.type === 'error' 
                                ? 'bg-red-50/80 border-red-150 text-red-900' 
                                : itm.type === 'warning'
                                ? 'bg-amber-50/70 border-amber-150 text-amber-900'
                                : 'bg-blue-50/70 border-blue-150 text-blue-950'
                            }`}
                          >
                            <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wider text-gray-400 border-b border-dashed border-gray-250 pb-0.5">
                              <span className="text-[#db5984] font-semibold">📍 บรรทัดแถวที่ {itm.rowNum} บน Google Sheet</span>
                              <span className={`px-1 py-0.2 rounded font-bold ${
                                itm.type === 'error' ? 'bg-red-100 text-red-600' : itm.type === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-600'
                              }`}>
                                {itm.type.toUpperCase()}
                              </span>
                            </div>
                            
                            <div className="font-bold flex items-center gap-1 text-xs">
                              <span className="text-gray-600">รหัสไปรษณีย์:</span>
                              <span className="font-mono text-gray-900 font-black">{itm.postalCode}</span>
                              {itm.subdistrict && <span className="text-gray-400 ml-1">({itm.subdistrict})</span>}
                            </div>

                            <p className="font-semibold text-gray-700 leading-tight">
                              🔍 {itm.message}
                            </p>

                            <p className="font-bold text-[#eb5e45] text-[10.5px] pt-0.5">
                              💡 คำแนะนำ: {itm.suggestion}
                            </p>
                          </div>
                        ))
                    )}
                  </div>

                  {/* Actions after Audit */}
                  <div className="flex gap-2 pt-1 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        const badRows = auditResult.issues
                          .map(i => `[แถวที่ ${i.rowNum}] รหัสไปรษณีย์: ${i.postalCode} - ${i.message} (ความต้องการแก้: ${i.suggestion})`)
                          .join('\n');
                        navigator.clipboard.writeText(badRows || "ตรวจสอบเสร็จสิ้นสมบูรณ์ดีเยี่ยม ไม่มีประเด็นต้องแก้ไขในบัญชีตาราง");
                        setCopiedIssuesText(true);
                        setTimeout(() => setCopiedIssuesText(false), 2500);
                      }}
                      className="flex-1 bg-white hover:bg-gray-50 border border-gray-200 text-gray-750 text-xs py-2 px-3 rounded-lg font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ClipboardList className="w-3.5 h-3.5 text-gray-500" />
                      <span>{copiedIssuesText ? 'คัดลอกรายการแล้ว!' : 'คัดลอกรายการแก้ไข'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => triggerManualAudit(false)}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs py-2 px-3 rounded-lg font-bold transition cursor-pointer"
                    >
                      🔄 สแกนใหม่
                    </button>
                  </div>

                  {/* Clear scan results action */}
                  <button
                    type="button"
                    onClick={() => setAuditResult(null)}
                    className="text-[10px] text-gray-400 hover:text-gray-600 hover:underline block text-left"
                  >
                    ล้างประวัติคำผลลัพธ์การตรวจสอบ
                  </button>
                </div>

              </div>
            )}
          </div>

          {/* Graphical layout column indicators */}
          <div className="border-t border-[#f0f2f5] pt-5 space-y-3.5 text-left">
            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wide">
              แผนผังการจัดวางคอลัมน์มาตรฐานร้าน
            </h4>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-150 rounded-xl">
                <span className="text-xs font-bold text-gray-650">A (คอลัมน์ 1)</span>
                <span className="text-xs font-semibold text-gray-900">รหัสไปรษณีย์ (เช่น 50240)</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-150 rounded-xl">
                <span className="text-xs font-bold text-gray-650">B (คอลัมน์ 2)</span>
                <span className="text-xs font-semibold text-gray-900">ตำบล / อำเภอ (เช่น อมก๋อย)</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-150 rounded-xl">
                <span className="text-xs font-bold text-gray-650">C (คอลัมน์ 3)</span>
                <span className="text-xs font-semibold text-gray-900">จังหวัด (เช่น เชียงใหม่)</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-150 rounded-xl">
                <span className="text-xs font-bold text-gray-650">D (คอลัมน์ 4)</span>
                <span className="text-xs font-semibold text-gray-900">สถานะพื้นที่ (ปกติ / พื้นที่ห่างไกล)</span>
              </div>
            </div>
          </div>

        </div>

        {/* Drawer footer buttons */}
        <div className="px-6 py-4 border-t border-[#f0f2f5] flex items-center justify-between bg-gray-50 text-left">
          <div className="flex flex-col items-start gap-1">
            <button
              onClick={onResetToDemo}
              className="text-[11px] font-bold text-red-500 hover:text-red-700 hover:underline cursor-pointer text-left"
              type="button"
            >
              รีเซ็ตใช้ตัวอย่าง Demo
            </button>
            {onLogout && (
              <button
                onClick={onLogout}
                className="text-[11px] font-bold text-gray-400 hover:text-red-500 hover:underline cursor-pointer text-left"
                type="button"
              >
                ออกจากระบบแอดมิน (Lock)
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 rounded-xl transition font-bold"
              type="button"
            >
              กลับ
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-xs bg-[#eb5e45] hover:bg-[#db523c] text-white font-bold rounded-xl shadow-sm hover:shadow transition cursor-pointer"
              type="button"
            >
              บันทึกโครงสร้าง
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
