import PDFDocument from 'pdfkit';

export const createPdfDocument = () => {
  return new PDFDocument({ size: 'A4', margin: 40 });
};
