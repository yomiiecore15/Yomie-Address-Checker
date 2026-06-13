import { PostalCodeData, SheetConfig } from './types';

export const DEFAULT_MESSAGES = {
  welcomeTh: "เช็คเขตพื้นที่ห่างไกล",
  subtitleTh: "กรอกรหัสไปรษณีย์ 5 หลัก เพื่อตรวจสอบค่าบริการจัดส่งเพิ่มเติม",
  searchPlaceholderTh: "เช่น 50240, 81150, 10110",
  searchingTh: "กำลังตรวจสอบพื้นที่...",
  notFoundTh: "ไม่พบรหัสไปรษณีย์นี้ในเขตพื้นที่ห่างไกล",
  notFoundSubTh: "รหัสไปรษณีย์นี้ จัดส่งราคาปกติ ไม่มีเก็บส่วนต่าง 20 บาทเพิ่มเติมค่ะ",
  foundTh: "รหัสไปรษณีย์นี้อยู่ใน 'เขตพื้นที่ห่างไกล'",
};

// Rich Thai Postal Codes Mocking Database for flawless demo/fallback
export const SAMPLE_POSTAL_CODES: PostalCodeData[] = [
  { postalCode: "50240", subdistrict: "อมก๋อย", province: "เชียงใหม่", area: "พื้นที่ห่างไกล" },
  { postalCode: "50240", subdistrict: "แม่ตื่น", province: "เชียงใหม่", area: "พื้นที่ห่างไกล" },
  { postalCode: "50310", subdistrict: "บ่อหลวง", province: "เชียงใหม่", area: "พื้นที่ห่างไกล" },
  { postalCode: "50350", subdistrict: "กัลยาณิวัฒนา", province: "เชียงใหม่", area: "พื้นที่ห่างไกล" },
  { postalCode: "58130", subdistrict: "ปางมะผ้า", province: "แม่ฮ่องสอน", area: "พื้นที่ห่างไกล" },
  { postalCode: "81150", subdistrict: "เกาะลันตาใหญ่", province: "กระบี่", area: "พื้นที่ห่างไกล" },
  { postalCode: "82160", subdistrict: "เกาะยาวน้อย", province: "พังงา", area: "พื้นที่ห่างไกล" },
  { postalCode: "23170", subdistrict: "เกาะกูด", province: "ตราด", area: "พื้นที่ห่างไกล" },
  { postalCode: "95110", subdistrict: "เบตง", province: "ยะลา", area: "พื้นที่ห่างไกล" },
  { postalCode: "96110", subdistrict: "แว้ง", province: "นราธิวาส", area: "พื้นที่ห่างไกล" },
  { postalCode: "10110", subdistrict: "คลองเตย", province: "กรุงเทพมหานคร", area: "ปกติ" },
  { postalCode: "10120", subdistrict: "ยานนาวา", province: "กรุงเทพมหานคร", area: "ปกติ" },
  { postalCode: "50000", subdistrict: "ศรีภูมิ", province: "เชียงใหม่", area: "ปกติ" },
  { postalCode: "20150", subdistrict: "บางละมุง", province: "ชลบุรี", area: "ปกติ" }
];

export const INITIAL_CONFIG: SheetConfig = {
  spreadsheetUrl: "https://docs.google.com/spreadsheets/d/14JxSbYeA2n3QATSd9BgiCQeWdh9Rv0mbCZP-vkuMZyE/edit?gid=0#gid=0",
  spreadsheetId: "14JxSbYeA2n3QATSd9BgiCQeWdh9Rv0mbCZP-vkuMZyE",
  sheetName: "", // Leaves blank to query first tab automatically
  isConfigured: true,
  useFallbackSample: false,
};

/**
 * Extract Spreadsheet ID from Google Sheets URL
 */
export function extractSpreadsheetId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : url;
}

/**
 * Generate Google Sheets Visualization API Query URL
 */
export function buildQueryUrl(spreadsheetId: string, sheetName: string, spreadsheetUrl?: string): string {
  let gid: string | null = null;
  if (spreadsheetUrl) {
    const match = spreadsheetUrl.match(/[?&#]gid=([0-9]+)/);
    if (match) {
      gid = match[1];
    }
  }

  if (sheetName) {
    const encSheet = encodeURIComponent(sheetName);
    let url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?sheet=${encSheet}&tqx=out:json`;
    if (gid) {
      url += `&gid=${gid}`;
    }
    return url;
  }

  let url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json`;
  if (gid) {
    url += `&gid=${gid}`;
  }
  return url;
}

/**
 * Parses Google Sheets visualization API JSON text cleanly for Postal Code columns A to D
 */
export function parsePostalCodeGvizData(text: string): PostalCodeData[] {
  const startMarker = "google.visualization.Query.setResponse(";
  const startIndex = text.indexOf(startMarker);
  if (startIndex === -1) {
    throw new Error("รูปแบบไฟล์ดึงค่าจาก Google Sheets ขัดข้อง ตรวจเช็คว่าเปิดแชร์สิทธิ์ 'ทุกคนที่มีลิงก์ดูได้' เสมอค่ะ");
  }
  
  const endMarker = ");";
  const endIndex = text.lastIndexOf(endMarker);
  if (endIndex === -1) {
    throw new Error("โครงสร้างตอบรับของ Google Sheets ผิดพลาด");
  }

  const jsonStr = text.substring(startIndex + startMarker.length, endIndex);
  const data = JSON.parse(jsonStr);
  
  if (!data?.table?.rows) {
    throw new Error("ไม่พบข้อมูลแผ่นงานใน Google Sheet นี้");
  }

  const rows = data.table.rows || [];

  return rows.map((row: any) => {
    const cells = row.c || [];
    
    const getCellValue = (idx: number): string => {
      if (idx === undefined || idx < 0 || idx >= cells.length) return "";
      const cell = cells[idx];
      if (!cell) return "";
      
      if (cell.f !== undefined) return String(cell.f).trim();
      if (cell.v !== undefined) {
        if (cell.v === null) return "";
        return String(cell.v).trim();
      }
      return "";
    };

    return {
      postalCode: getCellValue(0),   // Column A: รหัสไปรษณีย์
      subdistrict: getCellValue(1),  // Column B: ตำบล
      province: getCellValue(2),     // Column C: จังหวัด
      area: getCellValue(3),         // Column D: พื้นที่ (เช่น "พื้นที่ห่างไกล")
    };
  }).filter(item => item.postalCode && item.postalCode.length > 0);
}
