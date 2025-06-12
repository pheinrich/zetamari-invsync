This implements a tiny Shopify webhook to synchronize inventory item quantities across variants for Zetamari classes.

Classes have limited capacity, so students must reserve their space. For convenience, they may either pay in full or pay a 50% deposit, with the balance due on the first class day. Class availability reflects the number of paid students, whether they pay the full amount or the deposit.

Unfortunately, Shopify has no built-in facility for deposit payments, although many commercial apps with this functionality may be purchased (on a subscription basis) in the Shopify app store. As a free work-around, many use multiple variants (e.g. 'pay in full' and 'deposit only'). This approach has the significant drawback, though, that separate inventory levels are maintained for each variant. They must be synced manually to ensure against double-booking each class seat.

In an effort to avoid yet another $10/month subscription for what I consider very basic functionality, this is my home-grown solution. It is registered as a webhook on the Zetamari Shopify website, responding to changes to inventory levels. For each product whose "Sync Variant Inventory Quantities" metafield is true, reducing inventory for any variant will adjust all other variant inventory levels to match. This happens in response to both customer purchases and admin updates.
