export async function sendWhatsAppMessage(
  phone: string,
  message: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    let formattedPhone = phone.replace(/[^0-9]/g, "");
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "62" + formattedPhone.slice(1);
    }

    const response = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        Authorization: process.env.FONNTE_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        target: formattedPhone,
        message: message,
        countryCode: "62",
      }),
    });

    const data = await response.json();

    if (data.status === true) {
      return { success: true };
    } else {
      return {
        success: false,
        error: data.reason || "Gagal mengirim pesan via Fonnte.",
      };
    }
  } catch (error) {
    console.error("Fonnte Integration Error:", error);
    return { success: false, error: "Internal network error" };
  }
}
