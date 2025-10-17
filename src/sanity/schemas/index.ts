
import { type SchemaTypeDefinition } from 'sanity'
/*
export const schema: { types: SchemaTypeDefinition[] } = {
  types: [],
}
*/

// Barrel file: list all schematypes here and export as an array.
// Keeps the schema registration tidy.
import listing from './listing';
import agent from './agent';
import homePage from './homePage';
//import page from './schematypes/page';
//import testimonial from './schematypes/testimonial';

//const types = [homePage];

//export default types;
export const schema: { types: SchemaTypeDefinition[] } = {
  types: [homePage, listing, agent],
};