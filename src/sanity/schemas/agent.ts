// Sanity v2 - Agent schematype
export default {
  name: 'agent',
  title: 'Agent',
  type: 'document',
  fields: [
    { name: 'name', type: 'string', title: 'Name' },
    { name: 'bio', type: 'text', title: 'Bio' },
    { name: 'photo', type: 'image', title: 'Photo', options: { hotspot: true } },
    { name: 'email', type: 'string', title: 'Email' },
    { name: 'phone', type: 'string', title: 'Phone' }
  ],
  preview: {
    select: { title: 'name', media: 'photo' }
  }
};