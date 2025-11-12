import * as SecureStore from "expo-secure-store";

export type SessionData = {
  success: boolean;
  user_id?: number | string;
  name?: string;
  last_name?: string;
  manual?: number | string;
  paid?: number | string;
};

export async function checkSession(): Promise<SessionData | null> {
  try {
    const sessionId = await SecureStore.getItemAsync("phpSessionId");
    if (!sessionId) return null;

    const res = await fetch("https://rapportskollen.com/mobile/session_check.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `session_id=${encodeURIComponent(sessionId)}`
    });

    const text = await res.text();
    let data: SessionData;

    try {
      data = JSON.parse(text);
    } catch (e) {
      console.log("❌ JSON parse error:", text);
      return null;
    }

    if (!data?.success) return null;

    // refresh cached info
    if (data.name) await SecureStore.setItemAsync("userName", String(data.name));
    if (data.user_id) await SecureStore.setItemAsync("userID", String(data.user_id));
    if (data.manual !== undefined)
      await SecureStore.setItemAsync("userManual", String(data.manual));

    return data;
  } catch (e) {
    console.log("❌ checkSession error:", e);
    return null;
  }
}
