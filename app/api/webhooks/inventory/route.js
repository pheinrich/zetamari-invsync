import { NextRequest, NextResponse } from 'next/server'
import { verifyShopifyWebhook } from '@/lib/verifyWebhook'
import { syncVariantInventoryLevels } from '@/lib/syncInventory'

export async function POST( req )
{
  const rawBody = await req.text()
  const hmac = req.headers.get( 'x-shopify-hmac-sha256' ) || ''

  const verified = verifyShopifyWebhook( rawBody, hmac )
  if( !verified )
    return new NextResponse( 'Unauthorized', {status: 401} )

  const data = JSON.parse( rawBody )
  const {inventory_item_id, location_id} = data

  // Optional: Lookup associated product ID (or store this mapping in your DB)

  // Trigger sync (dummy product ID for now)
  await syncVariantInventoryLevels( '1234567890', '<your-shop>', '<token>' )

  return new NextResponse( 'OK' )
}
