//  file and full code edit
const API = import.meta.env.VITE_API_URL;

export const sendChat = async (prompt) => {
  const res = await fetch(`${API}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt }),
  });

  return res.json();
};
