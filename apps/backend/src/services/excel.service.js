import ExcelJS from 'exceljs';

export const createWorkbook = () => {
  return new ExcelJS.Workbook();
};
