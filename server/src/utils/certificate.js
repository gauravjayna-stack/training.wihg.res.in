const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const QRCode = require('qrcode');

const CERT_DIR = path.join(__dirname, '..', '..', 'uploads', 'certificates');
if (!fs.existsSync(CERT_DIR)) fs.mkdirSync(CERT_DIR, { recursive: true });

/** Generates a unique, sequential-looking certificate number, e.g. WIHG/2026/CERT/0042 */
function buildCertNo(sequence) {
  const year = new Date().getFullYear();
  return `WIHG/${year}/CERT/${String(sequence).padStart(4, '0')}`;
}

/**
 * Renders a branded WIHG certificate PDF with an embedded verification QR code.
 * Returns { pdfPath, qrCodeUrl } — paths are relative to /uploads for serving.
 */
async function generateCertificatePdf({ certNo, studentName, type, topic, mentorName, startDate, endDate, publicBaseUrl }) {
  const verifyUrl = `${publicBaseUrl}/verify/${encodeURIComponent(certNo)}`;
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 200 });
  const qrPngBytes = Buffer.from(qrDataUrl.split(',')[1], 'base64');

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([842, 595]); // A4 landscape
  const { width, height } = page.getSize();

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const italic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // Border
  page.drawRectangle({
    x: 20, y: 20, width: width - 40, height: height - 40,
    borderColor: rgb(0.1, 0.25, 0.45), borderWidth: 3,
  });
  page.drawRectangle({
    x: 30, y: 30, width: width - 60, height: height - 60,
    borderColor: rgb(0.1, 0.25, 0.45), borderWidth: 1,
  });

  const centerText = (text, y, f, size, color = rgb(0, 0, 0)) => {
    const textWidth = f.widthOfTextAtSize(text, size);
    page.drawText(text, { x: (width - textWidth) / 2, y, size, font: f, color });
  };

  centerText('WADIA INSTITUTE OF HIMALAYAN GEOLOGY', height - 90, fontBold, 20, rgb(0.1, 0.25, 0.45));
  centerText('Department of Science & Technology, Govt. of India', height - 112, font, 11);
  centerText('CERTIFICATE OF COMPLETION', height - 150, fontBold, 22);

  const typeLabel = type === 'DISSERTATION' ? 'Dissertation Work' : 'Internship Programme';
  centerText('This is to certify that', height - 195, italic, 13);
  centerText(studentName, height - 225, fontBold, 20);
  centerText(`has successfully completed the ${typeLabel}`, height - 250, font, 13);
  if (topic) centerText(`on "${topic}"`, height - 272, italic, 13);
  centerText(
    `at the Wadia Institute of Himalayan Geology from ${startDate} to ${endDate},`,
    height - 296, font, 12
  );
  centerText(`under the guidance of ${mentorName}.`, height - 316, font, 12);

  centerText(`Certificate No.: ${certNo}`, 90, font, 10);
  centerText(`Issued on: ${new Date().toLocaleDateString('en-IN')}`, 74, font, 10);

  const qrImage = await pdfDoc.embedPng(qrPngBytes);
  const qrDim = 90;
  page.drawImage(qrImage, { x: width - 150, y: 55, width: qrDim, height: qrDim });
  page.drawText('Scan to verify', { x: width - 148, y: 45, size: 8, font });

  page.drawText('_______________________', { x: 100, y: 130, size: 11, font });
  page.drawText('Mentor / Supervisor', { x: 130, y: 112, size: 10, font });

  page.drawText('_______________________', { x: width - 340, y: 130, size: 11, font });
  page.drawText('Training Cell, WIHG', { x: width - 300, y: 112, size: 10, font });

  const pdfBytes = await pdfDoc.save();
  const fileName = `${certNo.replace(/\//g, '_')}.pdf`;
  const filePath = path.join(CERT_DIR, fileName);
  fs.writeFileSync(filePath, pdfBytes);

  return {
    pdfPath: `/uploads/certificates/${fileName}`,
    absolutePath: filePath,
    qrCodeUrl: verifyUrl,
  };
}

module.exports = { buildCertNo, generateCertificatePdf };
