import crypto from 'crypto';

export function verifyShopifyWebhook( rawBody, hmacHeader )
{
  const generatedHash = crypto
    .createHmac( 'sha256', process.env.SHOPIFY_API_SECRET! )
    .update( rawBody, 'utf8' )
    .digest( 'base64' )

  return crypto.timingSafeEqual( Buffer.from( generatedHash ), Buffer.from( hmacHeader ) )
}
