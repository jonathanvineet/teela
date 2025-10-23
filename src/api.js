export async function getEthBalanceFromBackend(address) {
  const res = await fetch(`/api/balance/${address}`);
  if (!res.ok) throw new Error(`Backend error: ${res.status}`);
  return res.json();
}
