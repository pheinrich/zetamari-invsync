export async function verifyShopifyWebhook(rawBody, hmacHeader)
{
  const encoder = new TextEncoder();
  const key = encoder.encode(process.env.SHOPIFY_API_SECRET);
  const data = encoder.encode(rawBody);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, data);
  const generatedHmac = base64Encode(signature);

  return timingSafeEqual(generatedHmac, hmacHeader);
}

function base64Encode(arrayBuffer)
{
  const uint8Array = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < uint8Array.length; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binary);
}

function timingSafeEqual(a, b)
{
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
