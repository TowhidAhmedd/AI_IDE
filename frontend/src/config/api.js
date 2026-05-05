// export const API_BASE_URL = import.meta.env.VITE_API_URL;
const API_BASE_URL = import.meta.env.VITE_API_URL;


async function sendChat(message) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: message
      })
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    return data;

  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}

