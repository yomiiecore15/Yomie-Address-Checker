export interface PostalCodeData {
  postalCode: string;   // Column A: รหัสไปรษณีย์
  subdistrict: string;  // Column B: ตำบล
  province: string;     // Column C: จังหวัด
  area: string;         // Column D: พื้นที่
}

export interface SheetConfig {
  spreadsheetUrl: string;
  spreadsheetId: string;
  sheetName: string;
  isConfigured: boolean;
  useFallbackSample: boolean;
}

export interface AuditIssue {
  rowNum: number;
  postalCode: string;
  subdistrict: string;
  province: string;
  areaVal: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  suggestion: string;
}
