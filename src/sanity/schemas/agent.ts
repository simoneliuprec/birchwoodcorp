import { defineType, defineField } from 'sanity';

const agent = defineType({
  name: 'agent',
  title: 'Agent',
  type: 'document',
  fields: [
    defineField({ name: 'name', type: 'string', title: 'Name' }),
    defineField({ name: 'email', type: 'string', title: 'Bio' }),
    defineField({ name: 'phone', type: 'string', title: 'Phone' }),
    defineField({ name: 'photo', type: 'image', title: 'Photo', options: { hotspot: true }}),
    defineField({ name: 'email', type: 'string', title: 'Email'})
  ],
});

export default agent;
