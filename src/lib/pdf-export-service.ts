import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export interface ExportPdfOptions {
  filename?: string;
  quality?: number;
  scale?: number;
}

/**
 * Exports an HTML element directly to a downloadable multi-page A4 PDF file.
 */
export async function exportElementToPdf(
  element: HTMLElement,
  options: ExportPdfOptions = {}
): Promise<boolean> {
  const {
    filename = "axia-legal-report.pdf",
    quality = 0.98,
    scale = 2, // 2x resolution ensures sharp text and fine borders
  } = options;

  try {
    const canvas = await html2canvas(element, {
      scale,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      windowWidth: element.scrollWidth,
    });

    const imgData = canvas.toDataURL("image/jpeg", quality);

    // Standard A4 in millimeters: 210mm x 297mm
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    const pdfWidth = pdf.internal.pageSize.getWidth(); // 210
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 297

    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    // Add first page
    pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, undefined, "FAST");
    heightLeft -= pdfHeight;

    // Add subsequent pages if content overflows A4 height
    while (heightLeft > 2) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, undefined, "FAST");
      heightLeft -= pdfHeight;
    }

    // Trigger download
    const cleanFilename = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
    pdf.save(cleanFilename);
    return true;
  } catch (error) {
    console.error("Failed to generate PDF:", error);
    return false;
  }
}

/**
 * Triggers native browser print with a clean dedicated print window or element print
 */
export function printReportElement(element: HTMLElement): boolean {
  try {
    const printWindow = window.open("", "_blank", "width=900,height=750");
    if (!printWindow) {
      // Fallback to window.print if popup blocked
      window.print();
      return true;
    }

    const htmlContent = element.innerHTML;
    const doc = printWindow.document;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="utf-8" />
          <title>تقرير قانوني معتمد - أكسيا للمحاماة</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Arabic", sans-serif;
              background: #ffffff !important;
              color: #111827 !important;
              margin: 0;
              padding: 0;
              direction: rtl;
            }
            table {
              border-collapse: collapse;
              width: 100%;
            }
            th, td {
              border: 1px solid #e5e7eb;
              padding: 6px 8px;
            }
            .page-break-avoid {
              page-break-inside: avoid;
              break-inside: avoid;
            }
          </style>
        </head>
        <body>
          <div style="background: #ffffff; padding: 12px;">
            ${htmlContent}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.focus();
                window.print();
                window.close();
              }, 300);
            };
          </script>
        </body>
      </html>
    `);
    doc.close();
    return true;
  } catch (err) {
    console.error("Print error:", err);
    window.print();
    return true;
  }
}

/**
 * Generates an official unique reference code for legal reports
 */
export function generateReportRef(prefix = "AX-REP"): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${year}-${rand}`;
}
