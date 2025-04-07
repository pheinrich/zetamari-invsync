import { NextRequest, NextResponse } from 'next/server'
import { verifyShopifyWebhook } from '@/lib/verifyWebhook'
import { productFromInventoryItem } from '@/lib/findProduct'
import { syncVariantInventoryLevels } from '@/lib/syncInventory'

const host = 'zetamari.myshopify.com'
const accessToken = process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN

export async function POST( req )
{
  const rawBody = await req.text()
  const hmac = req.headers.get( 'x-shopify-hmac-sha256' ) || ''

  const verified = verifyShopifyWebhook( rawBody, hmac )
  if( !verified )
    return new NextResponse( 'Unauthorized', {status: 401} )

  const data = JSON.parse( rawBody )
  const productGid = await productFromInventoryItem(
    `gid://shopify/InventoryItem/${data.inventory_item_id}`,
    host,
    accessToken
  )

  // Trigger sync
  await syncVariantInventoryLevels( productGid, host, accessToken )

  return new NextResponse( 'OK' )
}
