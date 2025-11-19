import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'listing',
  title: 'Listing (MLS/DDF)',
  type: 'document',
  fields: [
    // Identifiers & basic
    defineField({
      name: 'mlsNumber',
      title: 'MLS Number',
      type: 'string',
      description: 'Primary MLS identifier (use this as canonical id)',
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'boardId',
      title: 'Board ID / DDF Source',
      type: 'string',
      description: 'MLS board / DDF source identifier (e.g., CREA board code)'
    }),
    defineField({ name: 'listingStatus', title: 'Listing Status', type: 'string' }),
    defineField({ name: 'propertyType', title: 'Property Type', type: 'string' }),

    // Pricing & dates
    defineField({ name: 'listPrice', title: 'List Price', type: 'number' }),
    defineField({ name: 'originalPrice', title: 'Original Price', type: 'number' }),
    defineField({ name: 'salePrice', title: 'Sale Price', type: 'number' }),
    defineField({ name: 'currency', title: 'Currency', type: 'string', initialValue: 'CAD' }),
    defineField({ name: 'listDate', title: 'List Date', type: 'datetime' }),
    defineField({ name: 'updateDate', title: 'Last Modified', type: 'datetime' }),
    defineField({ name: 'daysOnMarket', title: 'Days on Market', type: 'number' }),

    // Address (structured)
    defineField({
      name: 'address',
      title: 'Address',
      type: 'object',
      fields: [
        defineField({ name: 'streetNumber', title: 'Street Number', type: 'string' }),
        defineField({ name: 'streetName', title: 'Street Name', type: 'string' }),
        defineField({ name: 'unit', title: 'Unit / Apt', type: 'string' }),
        defineField({ name: 'municipality', title: 'Municipality / City', type: 'string' }),
        defineField({ name: 'neighbourhood', title: 'Neighbourhood', type: 'string' }),
        defineField({ name: 'province', title: 'Province / State', type: 'string' }),
        defineField({ name: 'postalCode', title: 'Postal Code', type: 'string' }),
        defineField({
          name: 'geo',
          title: 'Geolocation',
          type: 'object',
          fields: [
            defineField({ name: 'lat', title: 'Latitude', type: 'number' }),
            defineField({ name: 'lng', title: 'Longitude', type: 'number' })
          ]
        })
      ]
    }),

    // Property details
    defineField({ name: 'bedrooms', title: 'Bedrooms', type: 'number' }),
    defineField({ name: 'bathrooms', title: 'Bathrooms (full)', type: 'number' }),
    defineField({ name: 'bathroomsPartial', title: 'Bathrooms (partial)', type: 'number' }),
    defineField({ name: 'totalRooms', title: 'Total Rooms', type: 'number' }),
    defineField({ name: 'stories', title: 'Stories / Levels', type: 'number' }),
    defineField({ name: 'buildingAge', title: 'Building Age (yrs)', type: 'number' }),
    defineField({ name: 'buildingType', title: 'Building Type', type: 'string' }),
    defineField({ name: 'parkingType', title: 'Parking Type', type: 'string' }),
    defineField({ name: 'parkingSpaces', title: 'Parking Spaces', type: 'number' }),
    defineField({ name: 'heating', title: 'Heating', type: 'string' }),
    defineField({ name: 'cooling', title: 'Cooling / AC', type: 'string' }),
    defineField({ name: 'basement', title: 'Basement', type: 'string' }),

    // Measurements & lot
    defineField({
      name: 'dimensions',
      title: 'Dimensions / Sizes',
      type: 'object',
      fields: [
        defineField({ name: 'sqft', title: 'Interior Area (sqft)', type: 'number' }),
        defineField({ name: 'lotSize', title: 'Lot Size (text)', type: 'string' }),
        defineField({ name: 'lotArea', title: 'Lot Area (numeric)', type: 'number' })
      ]
    }),

    // Media and virtual tours
    defineField({
      name: 'mediaUrls',
      title: 'Media URLs',
      type: 'array',
      of: [{ type: 'url' }],
      description: 'External image/video URLs from MLS (editors can import into Sanity assets later)'
    }),
    defineField({
      name: 'mainImage',
      title: 'Main Image (Sanity asset)',
      type: 'image',
      options: { hotspot: true },
      description: 'Prefer uploading a Sanity asset for editorial control'
    }),
    defineField({
      name: 'gallery',
      title: 'Gallery (Sanity assets)',
      type: 'array',
      of: [{ type: 'image' }]
    }),
    defineField({ name: 'virtualTourUrl', title: 'Virtual Tour / 3D Tour URL', type: 'url' }),

    // Descriptions & remarks
    defineField({
      name: 'publicRemarks',
      title: 'Public Remarks',
      type: 'text',
      description: 'Text visible to public (MLS public remarks)'
    }),
    defineField({
      name: 'privateNotes',
      title: 'Private Notes',
      type: 'text',
      description: 'Internal notes (do not display publicly)'
    }),

    // Agent & office references
    defineField({
      name: 'listingAgent',
      title: 'Listing Agent',
      type: 'reference',
      to: [{ type: 'agent' }]
    }),
    defineField({ name: 'coOperatingBroker', title: 'Cooperating Broker / Office', type: 'string' }),

    // Features, amenities, extras
    defineField({
      name: 'amenities',
      title: 'Amenities / Features',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Pool, Fireplace, Waterfront, Elevator, etc.'
    }),
    defineField({
      name: 'keywords',
      title: 'Keywords / Tags',
      type: 'array',
      of: [{ type: 'string' }]
    }),

    // MLS metadata & provenance
    defineField({ name: 'source', title: 'Source', type: 'string', description: 'e.g. MLS DDF' }),
    defineField({ name: 'statusUpdatedAt', title: 'Status Updated At', type: 'datetime' }),
    defineField({ name: 'publicUrl', title: 'Public MLS URL', type: 'url' }),

    // Raw full payload for debugging / compliance
    // IMPORTANT: object types require a `fields` array. Here we add a single `payload` text field
    // storing the serialized JSON; you can replace this with a code field (via plugin) if desired.
    defineField({
      name: 'raw',
      title: 'Raw MLS Payload',
      type: 'object',
      options: { collapsible: true },
      description: 'Store full incoming MLS JSON for troubleshooting; keep collapsed by default',
      fields: [
        defineField({
          name: 'payload',
          title: 'JSON payload (stringified)',
          type: 'text',
          description: 'Paste or store stringified JSON here. For a better editor install sanity-plugin-code-input or sanity-plugin-json-input.'
        })
      ]
    })
  ],

  // Helpful preview in Studio list view
  preview: {
    select: {
      title: 'title',
      mls: 'mlsNumber',
      price: 'listPrice',
      media: 'mainImage',
      city: 'address.municipality'
    },
    prepare(selection) {
      const { title, mls, price, media, city } = selection;
      const subtitleParts: string[] = [];
      if (city) subtitleParts.push(String(city));
      if (price) subtitleParts.push(`$${Number(price).toLocaleString()}`);
      if (mls) subtitleParts.push(`MLS: ${mls}`);
      return {
        title: title || (mls ? `Listing ${mls}` : 'Untitled listing'),
        subtitle: subtitleParts.join(' • '),
        media: media
      };
    }
  }
});