import * as SecureStore from "expo-secure-store";

export async function changePassword(oldPass: string, newPass: string) {
  try {
    const sessionId = await SecureStore.getItemAsync("phpSessionId");
    if (!sessionId) {
      return { success: false, message: "Session missing – logga in igen" };
    }

    const res = await fetch("https://rapportskollen.com/mobile/change_pass.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: `PHPSESSID=${sessionId}`,
      },
      body: `old_password=${encodeURIComponent(oldPass)}&new_password=${encodeURIComponent(newPass)}`,
    });

    const text = await res.text();
    console.log("🔐 Change password response:", text);
    
    return JSON.parse(text);
  } catch (err) {
    return { success: false, message: "Serverfel – försök igen" };
  }
}
