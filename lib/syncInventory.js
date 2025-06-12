import { shopifyAdminRequest } from "./shopifyClient.js";

/**
 * Syncs all variants of a product to the minimum inventory level.
 * @param {string} productGid - Global ID of the product, e.g. gid://shopify/Product/1234567890
 * @param {string} shop - myshopify.com domain (e.g., my-store.myshopify.com)
 * @param {string} accessToken - Admin API token for the shop
 */
export async function syncVariantInventoryLevels( productGid, shop, accessToken )
{
  if( !shop || !shop.endsWith( '.myshopify.com' ) )
    throw new Error( `Invalid shop domain: ${shop}` )

  // console.log( `syncing productGid = ${productGid}` )

  // Step 1: Fetch product variants and their inventory info
  const productQuery = `
    query GetProductInventory($id: ID!) {
      product(id: $id) {
        id
        title
        metafield(namespace: "custom", key: "sync_variants") {
          value
        }
        variants(first: 25) {
          edges {
            node {
              id
              title
              inventoryItem {
                id
                inventoryLevels(first: 5) {
                  edges {
                    node {
                      id
                      quantities(names: ["available"]) {
                        name
                        quantity
                      }
                      location {
                        id
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const productRes = await shopifyAdminRequest(
    shop,
    accessToken,
    productQuery,
    {id: productGid,}
  )

  // console.log( '---------- productRes ' )
  // console.dir( productRes.data, {depth: null} )
  // console.log( '---------- /end productRes ' )

  const shouldSync = productRes.data?.product?.metafield?.value
  if( 'true' !== shouldSync )
  {
    console.log( `Skipping variant sync: ${productGid}` )
    return
  }

  const variants = productRes.data?.product?.variants?.edges || []
  let minAvailable = Infinity
  const levelsToUpdate = []

  for (const { node: variant } of variants)
  {
    const inventoryLevels = variant.inventoryItem.inventoryLevels.edges

    inventoryLevels.forEach( ({node: level}) => {
      const available = level.quantities.find( q => q.name === 'available' )?.quantity || 0

      if( available < minAvailable )
        minAvailable = available

      levelsToUpdate.push( {itemId: variant.inventoryItem.id, locationId: level.location.id, origQty: available} )
    })
  }

  console.log( '---------- levelsToUpdate ----------' )
  console.dir( levelsToUpdate, {depth: null} )
  console.log( '---------- /end levelsToUpdate ----------' )

  // Step 2: Update all inventory levels to match the minimum available
  const inventoryUpdateMutation = `
    mutation SetInventory($input: InventorySetQuantitiesInput!) {
      inventorySetQuantities(input: $input) {
        inventoryAdjustmentGroup {
          createdAt
          reason
          referenceDocumentUri
          changes {
            name
            delta
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  for (const level of levelsToUpdate)
  {
    // Avoid unnecessary updates when possible.
    if( level.origQty === minAvailable )
      continue

    const res = await shopifyAdminRequest(
      shop,
      accessToken,
      inventoryUpdateMutation,
      {
        input: {
          name: 'available',
          reason: 'correction',
          referenceDocumentUri: productGid,
          quantities: [
            {
              inventoryItemId: level.itemId,
              locationId: level.locationId,
              quantity: minAvailable,
              compareQuantity: level.origQty
            },
          ],
        },
      }
    )

    const errors = res.data?.inventorySetOnHandQuantities?.userErrors || []
    if( 0 < errors.length )
      console.warn( 'Inventory sync warning:', errors )
  }

  console.log( `Synced ${variants.length} variants to quantity: ${minAvailable}` )
}
