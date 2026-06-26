import Cerebras from "@cerebras/cerebras_cloud_sdk";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

function createProductChunks(): Array<{ id: string; content: string }> {
  const chunks: Array<{ id: string; content: string }> = [];

  try {
    const filePath = path.join(process.cwd(), "src", "data", "laung.json");
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const rawData = JSON.parse(fileContent);

    if (Array.isArray(rawData)) {
      rawData.forEach((item: any) => {
        const content = `
PERTANYAAN: ${item.question || "-"}
JAWABAN: ${item.answer || "-"}
KATEGORI: ${item.category || "-"}
KATA KUNCI: ${Array.isArray(item.keywords) ? item.keywords.join(", ") : "-"}
        `.trim();

        chunks.push({ id: item.id || `faq_${Math.random()}`, content });
      });
    }
  } catch (error) {
    console.error("Gagal membaca atau memproses file laung.json:", error);
    chunks.push({
      id: "fallback_info",
      content: "Data produk Laung saat ini tidak tersedia atau gagal dimuat.",
    });
  }

  return chunks;
}

function keywordScore(query: string, text: string): number {
  const q = query.toLowerCase();
  const t = text.toLowerCase();

  const words = q.split(/\s+/).filter((w) => w.length > 2);

  let score = 0;
  for (const word of words) {
    if (t.includes(word)) score += 1;
  }

  return score;
}

const client = new Cerebras({
  apiKey: process.env.CEREBRAS_API_KEY,
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const question = searchParams.get("q") || "";

    if (!question.trim()) {
      return NextResponse.json({
        success: true,
        answer: "Halo! Ada yang bisa saya bantu mengenai produk kami?",
      });
    }

    const chunks = createProductChunks();

    const chunkScores = chunks.map((chunk) => ({
      id: chunk.id,
      content: chunk.content,
      score: keywordScore(question, chunk.content),
    }));

    chunkScores.sort((a, b) => b.score - a.score);
    const topChunks = chunkScores.slice(0, 3);

    const bestContext = topChunks.map((c) => c.content).join("\n\n---\n\n");

    const aiResponse = await client.chat.completions.create({
      model: "zai-glm-4.7",
      max_tokens: 2048,
      messages: [
        {
          role: "system",
          content: `Anda adalah asisten virtual resmi untuk aplikasi Laung, aplikasi yang membantu nelayan menemukan lokasi tangkapan ikan menggunakan data satelit.

SIAPA PENGGUNA ANDA:
Pengguna utama adalah orang tua usia sekitar 30-50 tahun yang berprofesi sebagai nelayan, dengan latar belakang pendidikan dan keakraban teknologi yang beragam. Mereka mungkin mengetik tidak rapi, memakai bahasa daerah, bahasa gaul, singkatan, atau kalimat tidak baku dan typo (contoh: "apatuh laung coy", "laung itu apa sih", "gmn cara pake laung", "laung buat apaan ya", "harga laung brp"). Ada juga pengguna lebih muda (gen Z, anak/cucu nelayan) yang memakai gaya bahasa santai dan singkatan.

ATURAN MEMAHAMI PERTANYAAN:
1. JANGAN terpaku pada kata-kata baku atau tata bahasa formal dalam pertanyaan pengguna. Abaikan typo, singkatan, bahasa gaul, atau partikel seperti "coy", "sih", "dong", "gan", "kak", "bro" dan sejenisnya.
2. Selalu cari MAKSUD atau INTI pertanyaan di balik kalimat tidak baku tersebut, lalu cocokkan maksud itu dengan konteks data produk di bawah, bukan dengan kata per kata secara harfiah.
3. Konteks data di bawah ini ditulis dengan istilah yang cukup teknis/ilmiah (misalnya DSS, klorofil-a, SST, ZPPI, RAG, PWA, geospasial, dsb). Istilah ini ditulis untuk dokumentasi internal, BUKAN untuk dibacakan langsung ke pengguna. Tugas Anda adalah membaca makna di balik istilah tersebut lalu menyampaikannya ulang dengan kata-kata sehari-hari yang biasa dipakai di kampung/pelabuhan.
4. Jika konteks yang diberikan punya keterkaitan tema dengan pertanyaan pengguna meskipun kata-katanya berbeda jauh, gunakan konteks itu untuk menjawab.
5. Hanya jawab "Maaf, informasi mengenai hal tersebut belum tersedia di katalog kami." jika benar-benar tidak ada satupun konteks yang berkaitan dengan topik yang ditanyakan, BUKAN karena kata-katanya tidak baku atau karena istilah di konteks terasa teknis.

ATURAN GAYA JAWABAN (PALING PENTING):
1. Jawab HANYA berdasarkan informasi pada konteks data produk yang disediakan. Jangan mengarang informasi di luar konteks, dan jangan menyebutkan nama model AI, versi teknologi AI, atau detail teknis internal apa pun yang tidak relevan bagi pengguna.
2. Gunakan Bahasa Indonesia yang SANGAT sederhana, hangat, dan sopan, seolah menjelaskan langsung secara lisan kepada bapak/ibu nelayan yang baru pertama kali dengar soal ini.
3. WAJIB terjemahkan istilah teknis/ilmiah dari konteks ke bahasa sehari-hari. Contoh cara menerjemahkan (bukan untuk dihafal kata-katanya, tapi pahami pendekatannya): "klorofil-a" boleh disampaikan sebagai tanda ada banyak makanan ikan/plankton di air; "suhu permukaan laut (SST)" sebagai suhu air laut yang cocok buat ikan; "DSS/algoritma scoring" sebagai cara aplikasi menghitung dan merekomendasikan titik yang paling berpotensi; "PWA" sebagai aplikasi yang bisa dipasang dari browser HP tanpa lewat Play Store/App Store; "RAG/chatbot AI" cukup disebut sebagai fitur tanya-jawab otomatis di aplikasi. Jangan menyebutkan singkatan teknis itu sendiri ke pengguna kecuali pengguna yang menyebutnya duluan.
4. Langsung ke inti jawaban di kalimat pertama. Jangan basa-basi panjang, jangan mengulang-ulang pertanyaan pengguna, jangan menyalin susunan kalimat konteks secara mentah.
5. Jawaban maksimal 2-4 kalimat singkat, atau poin-poin pendek jika informasinya berupa beberapa hal (misalnya daftar fitur atau langkah-langkah). Jangan menjawab lebih dari itu meskipun konteksnya panjang.
6. Boleh menyesuaikan sedikit gaya bicara mengikuti gaya pengguna (santai untuk yang santai, lebih kalem untuk yang formal), tapi isi jawaban tetap sederhana dan mudah dipahami semua kalangan, dari anak muda sampai orang tua nelayan.
7. Tetap ramah dan hangat, seperti berbicara dengan tetangga di pelabuhan, bukan seperti membaca buku panduan teknis.`,
        },
        {
          role: "user",
          content: `Konteks Data Produk:\n${bestContext}\n\nPertanyaan Pelanggan (boleh tidak baku/santai, pahami maksudnya): ${question}\n\nJawaban (Bahasa Indonesia, sederhana, singkat, ramah, langsung ke inti):`,
        },
      ],
    });

    const choices = (aiResponse as any)?.choices;
    const answer =
      choices?.[0]?.message?.content ??
      "Maaf, kami sedang mengalami kendala teknis dalam memproses jawaban Anda.";

    return NextResponse.json({
      success: true,
      question,
      answer,
      context_used: topChunks.map((c) => ({ id: c.id, score: c.score })),
    });
  } catch (error) {
    console.error("Error pada endpoint chat-bot:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        question: "Terjadi kesalahan internal",
      },
      { status: 500 },
    );
  }
}
