import { shopifyAdminRequest } from './shopifyClient'

export async function syncVariantInventoryLevels( productId, shop, accessToken )
{
  // Step 1: Get product variants
  const productRes = await shopifyAdminRequest( shop, accessToken, `
    query GetVariants($id: ID!) {
      product(id: $id) {
        variants(first: 10) {
          edges {
            node {
              id
              inventoryItem {
                id
                inventoryLevels(first: 5) {
                  edges {
                    node {
                      id
                      available
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
  `,
  {
    id: `gid://shopify/Product/${productId}`
  })

  const variants = productRes.data.product.variants.edges.map( edge => edge.node )

  // Step 2: Find the minimum quantity across all variants
  let minAvailable = Infinity
  const inventoryUpdates = []

  for( const variant of variants )
  {
    const level = variant.inventoryItem.inventoryLevels.edges[0]?.node
    if( !level )
      continue

    const { id, available, location } = level
    if( available < minAvailable )
      minAvailable = available

    inventoryUpdates.push( {inventoryLevelId: id, locationId: location.id} )
  }

  // Step 3: Update all variants to the minimum
  for( const {inventoryLevelId} of inventoryUpdates )
  {
    await shopifyAdminRequest( shop, accessToken, `
      mutation adjustInventory($inventoryLevelId: ID!, $available: Int!) {
        inventoryAdjustQuantity(
          input: {
            inventoryLevelId: $inventoryLevelId,
            availableDelta: $available
          }
        ) {
          inventoryLevel {
            id
            available
          }
          userErrors {
            field
            message
          }
        }
      }
    `,
    {
      inventoryLevelId,
      available: minAvailable, // reset to min
    })
  }
}
