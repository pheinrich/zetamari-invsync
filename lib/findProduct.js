import { NextResponse } from 'next/server'
import { shopifyAdminRequest } from './shopifyClient'

export async function productFromInventoryItem( inventoryItemGid, shop, accessToken )
{
  if( !shop || !shop.endsWith( '.myshopify.com' ) )
    throw new Error( `Invalid shop domain: ${shop}` )

  console.log( `finding product for inventoryItemGid = ${inventoryItemGid}` )
  
  try
  {
    const variantQuery = `
      query ($inventoryItemId: ID!) {
        inventoryItem(id: $inventoryItemId) {
          variant {
            product {
              id
              title
            }
          }
        }
      }
    `;

    const result = await shopifyAdminRequest(
      shop,
      accessToken,
      variantQuery,
      {inventoryItemId: inventoryItemGid}
    )

    const product = result?.data?.inventoryItem?.variant?.product
    if( !product?.id )
    {
      console.warn( 'No product found for inventory item', inventoryItemGid )
      return new NextResponse( 'No matching product', {status: 204} )
    }

    return product.id
  }
  catch( error )
  {
    console.error( 'Webhook handler error:', error )
    return new NextResponse( 'Internal error', {status: 500} )
  }
}