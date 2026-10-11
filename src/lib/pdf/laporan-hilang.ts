import "server-only";
import PDFDocument from "pdfkit";

export interface LaporanHilangLokasi {
  area?: string;
  latitude: number;
  longitude: number;
  waktuKirim: string;
}

export interface LaporanHilangData {
  nama: string;
  username: string;
  kode: string;
  waktuLapor: string;
  mulaiSesi?: string;
  lokasi?: LaporanHilangLokasi | null;
  keterangan: string;
  pelapor: { nama: string; telepon: string };
  foto?: Buffer | null;
}

const REPLACEMENTS: Record<string, string> = {
  "\u2014": "-",
  "\u2013": "-",
  "\u2018": "'",
  "\u2019": "'",
  "\u201C": '"',
  "\u201D": '"',
  "\u2026": "...",
  "\u00D7": "x",
  "\u2022": "-",
  "\u2713": "v",
  "\u2714": "v",
};

export function sanitizePdfText(input?: string | null): string {
  if (!input) return "";
  let s = input.normalize("NFC");
  for (const [from, to] of Object.entries(REPLACEMENTS)) {
    s = s.split(from).join(to);
  }
  let out = "";
  for (const ch of s) {
    const cp = ch.codePointAt(0) ?? 0;
    if (cp === 0x0a || cp === 0x0d) {
      out += "\n";
    } else if (cp >= 0x20 && cp <= 0x00ff) {
      out += ch;
    }
  }
  return out.replace(/\n{3,}/g, "\n\n");
}

function separator(doc: PDFKit.PDFDocument) {
  doc
    .moveTo(40, doc.y + 4)
    .lineTo(555.28, doc.y + 4)
    .lineWidth(0.8)
    .strokeColor("#bbbbbb")
    .stroke()
    .moveDown(0.6);
}

function sectionTitle(doc: PDFKit.PDFDocument, title: string) {
  doc.moveDown(0.3);
  doc
    .fontSize(11)
    .font("Helvetica-Bold")
    .fillColor("#0f766e")
    .text(title.toUpperCase())
    .fillColor("#000000")
    .moveDown(0.2);
}

function labelValue(
  doc: PDFKit.PDFDocument,
  label: string,
  value: string,
  options?: { link?: string },
) {
  doc
    .fontSize(10)
    .font("Helvetica-Bold")
    .text(label + " : ", { continued: true });
  doc.font("Helvetica").fontSize(10).text(value, {
    link: options?.link,
    underline: options?.link ? true : false,
  });
}

export function generateLaporanHilangPdf(
  data: LaporanHilangData,
): Promise<Buffer> {
  const doc = new PDFDocument({
    size: "A4",
    margin: 40,
    info: {
      Title: `Laporan Orang Hilang - ${sanitizePdfText(data.nama)}`,
      Author: "Laung App",
    },
  });

  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));

  return new Promise((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc
      .fontSize(17)
      .font("Helvetica-Bold")
      .text("LAPORAN ORANG HILANG DI LAUT", { align: "center" });
    doc
      .fontSize(9)
      .font("Helvetica")
      .fillColor("#555555")
      .text("Laung App - Family View / Lapor Nelayan Hilang", {
        align: "center",
      })
      .fillColor("#000000");
    doc.moveDown(0.6);
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .fillColor("#0f766e")
      .text("KODE LAPORAN: " + sanitizePdfText(data.kode), { align: "center" })
      .fillColor("#000000");
    doc.moveDown(0.6);
    separator(doc);

    sectionTitle(doc, "Identitas Nelayan");
    labelValue(doc, "Nama lengkap", sanitizePdfText(data.nama));
    labelValue(doc, "Username", sanitizePdfText(data.username));
    labelValue(doc, "Laporan dibuat", sanitizePdfText(data.waktuLapor));
    if (data.mulaiSesi) {
      labelValue(doc, "Pelacakan dimulai", sanitizePdfText(data.mulaiSesi));
    }

    sectionTitle(doc, "Lokasi Terakhir (Dikirim Otomatis)");
    if (data.lokasi) {
      labelValue(
        doc,
        "Waktu pengiriman",
        sanitizePdfText(data.lokasi.waktuKirim),
      );
      labelValue(
        doc,
        "Area perkiraan",
        sanitizePdfText(data.lokasi.area) || "Lokasi GPS",
      );
      const coords = `${data.lokasi.latitude.toFixed(5)}, ${data.lokasi.longitude.toFixed(5)}`;
      const mapsUrl = `https://maps.google.com/?q=${data.lokasi.latitude},${data.lokasi.longitude}`;
      labelValue(doc, "Koordinat", coords);
      labelValue(doc, "Lihat di peta", mapsUrl, { link: mapsUrl });
    } else {
      doc
        .fontSize(10)
        .font("Helvetica")
        .text("Belum ada data lokasi yang berhasil terkirim.");
    }

    sectionTitle(doc, "Keterangan Pelapor");
    labelValue(doc, "Nama pelapor", sanitizePdfText(data.pelapor.nama));
    labelValue(doc, "Nomor HP pelapor", sanitizePdfText(data.pelapor.telepon));

    sectionTitle(doc, "Catatan Tambahan");
    if (data.keterangan) {
      doc
        .fontSize(10)
        .font("Helvetica")
        .text(sanitizePdfText(data.keterangan), { lineGap: 3 });
    } else {
      doc.fontSize(10).font("Helvetica").text("-");
    }

    if (data.foto) {
      sectionTitle(doc, "Foto Terlampir");
      try {
        doc.image(data.foto, { fit: [480, 300], align: "center" });
      } catch {
        doc
          .fontSize(9)
          .font("Helvetica-Oblique")
          .fillColor("#888888")
          .text("(Foto tidak dapat dimuat pada dokumen ini)")
          .fillColor("#000000");
      }
    }

    doc.moveDown(1);
    separator(doc);
    doc
      .fontSize(8)
      .font("Helvetica-Oblique")
      .fillColor("#666666")
      .text(
        "Catatan: Dokumen ini dibuat otomatis oleh sistem Laung. Untuk penanganan darurat, " +
          "hubungi BASARNAS (115) atau Polairud (110) dengan membawa kode laporan di atas.",
      );

    doc.end();
  });
}