import jsPDF from "jspdf";
import QRCode from "qrcode";
import JsBarcode from "jsbarcode";

export interface PrintReceiptData {
  id_penjualan: number;
  total_item: number;
  total_harga: number;
  diskon: number;
  discount_type: "percentage" | "amount";
  bayar: number;
  diterima: number;
  created_at: string;
  member?: {
    nama: string;
    kode_member: string;
  };
  user?: {
    name: string;
  };
  items: Array<{
    nama_kategori: string;
    harga_jual: number;
    jumlah: number;
    subtotal: number;
  }>;
  setting: {
    nama_perusahaan: string;
    alamat: string;
    telepon: string;
  };
}

export interface PrintBarcodeData {
  id_kategori: number;
  nama_kategori: string;
  kode_kategori: string;
  harga_jual: number;
}

export interface PrintMemberCardData {
  id_member: number;
  kode_member: string;
  nama: string;
  telepon: string;
  alamat: string;
}

export class PrintService {
  // Small receipt printing (75mm thermal printer format)
  static async printSmallReceipt(data: PrintReceiptData): Promise<void> {
    const printWindow = window.open("", "_blank", "width=300,height=600");
    if (!printWindow) return;

    const receiptHtml = this.generateSmallReceiptHTML(data);
    printWindow.document.write(receiptHtml);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  }

  // Large receipt printing (PDF format)
  static async printLargeReceipt(data: PrintReceiptData): Promise<void> {
    const doc = new jsPDF();

    // Company header
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(data.setting.nama_perusahaan.toUpperCase(), 105, 20, {
      align: "center",
    });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(data.setting.alamat || "", 105, 30, { align: "center" });

    if (data.setting.telepon) {
      doc.text(`Tel: ${data.setting.telepon}`, 105, 35, { align: "center" });
    }

    // Receipt details
    let yPosition = 50;
    doc.setFontSize(10);
    doc.text(
      `Date: ${new Date(data.created_at).toLocaleDateString()}`,
      20,
      yPosition
    );
    doc.text(`Cashier: ${data.user?.name || "Unknown"}`, 20, yPosition + 5);
    doc.text(
      `Receipt #: ${data.id_penjualan.toString().padStart(10, "0")}`,
      20,
      yPosition + 10
    );

    if (data.member) {
      doc.text(
        `Member: ${data.member.nama} (${data.member.kode_member})`,
        20,
        yPosition + 15
      );
    }

    yPosition += 25;

    // Items table
    doc.setFontSize(9);
    doc.text("Item", 20, yPosition);
    doc.text("Qty", 120, yPosition);
    doc.text("Price", 140, yPosition);
    doc.text("Total", 170, yPosition);

    yPosition += 5;
    doc.line(20, yPosition, 190, yPosition);
    yPosition += 5;

    data.items.forEach((item) => {
      doc.text(item.nama_kategori, 20, yPosition);
      doc.text(item.jumlah.toString(), 120, yPosition);
      doc.text(`Rp ${item.harga_jual.toLocaleString()}`, 140, yPosition);
      doc.text(`Rp ${item.subtotal.toLocaleString()}`, 170, yPosition);
      yPosition += 5;
    });

    yPosition += 5;
    doc.line(20, yPosition, 190, yPosition);
    yPosition += 5;

    // Totals
    doc.setFont("helvetica", "bold");
    doc.text(`Total Items: ${data.total_item}`, 20, yPosition);
    doc.text(`Rp ${data.total_harga.toLocaleString()}`, 170, yPosition);
    yPosition += 5;

    const discountAmount =
      data.discount_type === "percentage"
        ? (data.total_harga * data.diskon) / 100
        : data.diskon;

    doc.text(
      `Discount: ${
        data.discount_type === "percentage" ? `${data.diskon}%` : "Fixed"
      }`,
      20,
      yPosition
    );
    doc.text(`Rp ${discountAmount.toLocaleString()}`, 170, yPosition);
    yPosition += 5;

    doc.text(`Amount to Pay:`, 20, yPosition);
    doc.text(`Rp ${data.bayar.toLocaleString()}`, 170, yPosition);
    yPosition += 5;

    doc.text(`Received:`, 20, yPosition);
    doc.text(`Rp ${data.diterima.toLocaleString()}`, 170, yPosition);
    yPosition += 5;

    doc.text(`Change:`, 20, yPosition);
    doc.text(
      `Rp ${(data.diterima - data.bayar).toLocaleString()}`,
      170,
      yPosition
    );

    // Footer
    yPosition += 15;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Thank you for your purchase!", 105, yPosition, {
      align: "center",
    });

    doc.save(`receipt-${data.id_penjualan}-${Date.now()}.pdf`);
  }

  // Barcode printing
  static async printBarcodes(categories: PrintBarcodeData[]): Promise<void> {
    const printWindow = window.open("", "_blank", "width=800,height=600");
    if (!printWindow) return;

    const barcodeHtml = this.generateBarcodeHTML(categories);
    printWindow.document.write(barcodeHtml);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  }

  // Member card printing
  static async printMemberCards(members: PrintMemberCardData[]): Promise<void> {
    const printWindow = window.open("", "_blank", "width=800,height=600");
    if (!printWindow) return;

    const cardHtml = await this.generateMemberCardHTML(members);
    printWindow.document.write(cardHtml);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  }

  private static generateSmallReceiptHTML(data: PrintReceiptData): string {
    const formatCurrency = (amount: number) => `Rp ${amount.toLocaleString()}`;
    const formatDate = (date: string) => new Date(date).toLocaleDateString();

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Receipt</title>
        <style>
          * { font-family: "Consolas", monospace; }
          body { width: 75mm; margin: 0; padding: 5px; }
          .center { text-align: center; }
          .right { text-align: right; }
          .bold { font-weight: bold; }
          .separator { border-top: 1px dashed #000; margin: 5px 0; }
          @media print {
            @page { margin: 0; size: 75mm auto; }
            body { width: 70mm; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body onload="window.print()">
        <button class="no-print" onclick="window.print()" style="position: fixed; top: 5px; right: 5px;">Print</button>
        
        <div class="center">
          <h3 style="margin: 5px 0;">${data.setting.nama_perusahaan.toUpperCase()}</h3>
          <p style="margin: 2px 0;">${data.setting.alamat || ""}</p>
          ${
            data.setting.telepon
              ? `<p style="margin: 2px 0;">Tel: ${data.setting.telepon}</p>`
              : ""
          }
        </div>
        
        <div class="separator"></div>
        
        <div style="display: flex; justify-content: space-between; margin: 5px 0;">
          <span>${formatDate(data.created_at)}</span>
          <span>${data.user?.name || "Unknown"}</span>
        </div>
        
        <p>No: ${data.id_penjualan.toString().padStart(10, "0")}</p>
        ${
          data.member
            ? `<p>Member: ${data.member.nama} (${data.member.kode_member})</p>`
            : ""
        }
        
        <div class="separator"></div>
        
        <table width="100%" style="border-collapse: collapse;">
          ${data.items
            .map(
              (item) => `
            <tr>
              <td colspan="3">${item.nama_produk}</td>
            </tr>
            <tr>
              <td>${item.jumlah} x ${formatCurrency(item.harga_jual)}</td>
              <td></td>
              <td class="right">${formatCurrency(item.subtotal)}</td>
            </tr>
          `
            )
            .join("")}
        </table>
        
        <div class="separator"></div>
        
        <table width="100%" style="border-collapse: collapse;">
          <tr>
            <td>Total Harga:</td>
            <td class="right">${formatCurrency(data.total_harga)}</td>
          </tr>
          <tr>
            <td>Total Item:</td>
            <td class="right">${data.total_item}</td>
          </tr>
          <tr>
            <td>Diskon:</td>
            <td class="right">${
              data.discount_type === "percentage"
                ? `${data.diskon}%`
                : `Rp ${data.diskon.toLocaleString()}`
            }</td>
          </tr>
          <tr>
            <td>Total Bayar:</td>
            <td class="right">${formatCurrency(data.bayar)}</td>
          </tr>
          <tr>
            <td>Diterima:</td>
            <td class="right">${formatCurrency(data.diterima)}</td>
          </tr>
          <tr>
            <td>Kembali:</td>
            <td class="right">${formatCurrency(data.diterima - data.bayar)}</td>
          </tr>
        </table>
        
        <div class="separator"></div>
        <div class="center">
          <p><strong>-- TERIMA KASIH --</strong></p>
        </div>
      </body>
      </html>
    `;
  }

  private static generateBarcodeHTML(categories: PrintBarcodeData[]): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Category Barcodes</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .barcode-container { 
            display: inline-block; 
            margin: 10px; 
            padding: 10px; 
            border: 1px solid #ccc; 
            text-align: center;
            width: 200px;
          }
          .barcode { margin: 10px 0; }
          .category-name { font-weight: bold; margin-bottom: 5px; }
          .category-price { color: #666; }
          .category-code { font-size: 12px; margin-top: 5px; }
          @media print {
            .no-print { display: none; }
            body { margin: 0; }
          }
        </style>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
      </head>
      <body onload="generateBarcodes()">
        <button class="no-print" onclick="window.print()" style="position: fixed; top: 10px; right: 10px; padding: 10px;">Print</button>
        
        <div style="display: flex; flex-wrap: wrap;">
          ${categories
            .map(
              (category) => `
              <div class="barcode-container">
              <div class="category-name">${category.nama_kategori}</div>
              <div class="category-price">Rp ${category.harga_jual.toLocaleString()}</div>
              <svg class="barcode" id="barcode-${category.id_kategori}"></svg>
              <div class="category-code">${category.kode_kategori}</div>
            </div>
          `
            )
            .join("")}
        </div>
        
        <script>
          function generateBarcodes() {
            ${categories
              .map(
                (category) => `
              JsBarcode("#barcode-${category.id_kategori}", "${category.kode_kategori}", {
                format: "CODE128",
                width: 2,
                height: 60,
                displayValue: false
              });
            `
              )
              .join("")}
          }
        </script>
      </body>
      </html>
    `;
  }

  private static async generateMemberCardHTML(
    members: PrintMemberCardData[]
  ): Promise<string> {
    const qrCodes = await Promise.all(
      members.map((member) => QRCode.toDataURL(member.kode_member))
    );

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Member Cards</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .card-container { 
            display: inline-block; 
            margin: 10px; 
            width: 85.6mm;
            height: 54mm;
            border: 1px solid #000;
            position: relative;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }
          .card-logo {
            position: absolute;
            top: 3pt;
            right: 16pt;
            font-size: 16pt;
            font-weight: bold;
          }
          .card-name {
            position: absolute;
            top: 100pt;
            right: 16pt;
            font-size: 12pt;
            font-weight: bold;
          }
          .card-phone {
            position: absolute;
            top: 120pt;
            right: 16pt;
            font-size: 10pt;
          }
          .card-qr {
            position: absolute;
            top: 105pt;
            left: 10pt;
            border: 1px solid #fff;
            padding: 2px;
            background: #fff;
          }
          .card-qr img {
            width: 45px;
            height: 45px;
          }
          @media print {
            .no-print { display: none; }
            body { margin: 0; }
          }
        </style>
      </head>
      <body onload="window.print()">
        <button class="no-print" onclick="window.print()" style="position: fixed; top: 10px; right: 10px; padding: 10px;">Print</button>
        
        <div style="display: flex; flex-wrap: wrap;">
          ${members
            .map(
              (member, index) => `
            <div class="card-container">
              <div class="card-logo">SVJ OUTDOOR</div>
              <div class="card-name">${member.nama}</div>
              <div class="card-phone">${member.telepon || ""}</div>
              <div class="card-qr">
                <img src="${qrCodes[index]}" alt="QR Code">
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      </body>
      </html>
    `;
  }
}
