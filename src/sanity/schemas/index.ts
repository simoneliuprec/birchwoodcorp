
import { type SchemaTypeDefinition } from 'sanity'
import listing from './listing';
import agent from './agent';
import homePage from './homePage';
//import page from './schematypes/page';
//import testimonial from './schematypes/testimonial';

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [homePage, listing, agent],
};