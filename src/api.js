const BACKEND_URL = "http://localhost:5001";

export async function getEthBalanceFromBackend(address) {
  const res = await fetch(`${BACKEND_URL}/balance/${address}`);
  if (!res.ok) throw new Error(`Backend error: ${res.status}`);
  return res.json();
}
