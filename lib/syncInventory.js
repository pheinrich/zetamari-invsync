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

  // Step 1: Fetch product variants and their inventory info
  const productQuery = `
    query GetProductInventory($id: ID!) {
      product(id: $id) {
        id
        title
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
                      quantities(names: ["on_hand"]) {
                        name
                        quantity
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
  );

  const variants = productRes.data?.product?.variants?.edges || [];

  let minAvailable = Infinity
  const levelsToUpdate = []

  for (const { node: variant } of variants)
  {
    const inventoryLevels = variant.inventoryItem.inventoryLevels.edges

    inventoryLevels.forEach( ({node: level}) => {
      const available = level.quantities.find( q => q.name === 'on_hand' )?.quantity || 0

      if( available < minAvailable )
        minAvailable = minAvailable

      levelsToUpdate.push( level.id )
    })
  }

  // Step 2: Update all inventory levels to match the minimum available
  const inventoryUpdateMutation = `
    mutation SetInventory($input: InventorySetQuantitiesInput!) {
      inventorySetQuantities(input: $input) {
        inventoryLevels {
          id
          quantities(names: ["on_hand"]) {
            name
            quantity
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

   for (const inventoryLevelId of levelsToUpdate)
   {
    const res = await shopifyAdminRequest(
      shop,
      accessToken,
      inventoryUpdateMutation,
      {
        input: {
          setQuantities: [
            {
              inventoryLevelId,
              quantities: [
                {
                  name: 'on_hand',
                  quantity: minAvailable,
                },
              ],
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
