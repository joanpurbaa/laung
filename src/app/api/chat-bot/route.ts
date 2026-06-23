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
      max_tokens: 1024,
      messages: [
        {
          role: "system",
          content: `Anda adalah asisten virtual toko/layanan pelanggan resmi untuk produk kami.
TUGAS ANDA: Menjawab pertanyaan pelanggan HANYA berdasarkan informasi data produk (konteks) yang disediakan.
Aturan penting:
1. Jika jawaban tidak ada di dalam konteks produk yang diberikan, jawablah dengan ramah: "Maaf, informasi mengenai produk atau hal tersebut belum tersedia di katalog kami."
2. Berikan jawaban yang informatif, jelas, menggunakan Bahasa Indonesia yang santun dan profesional.`,
        },
        {
          role: "user",
          content: `Konteks Data Produk:\n${bestContext}\n\nPertanyaan Pelanggan: ${question}\n\nJawaban (Bahasa Indonesia, ramah dan jelas):`,
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
