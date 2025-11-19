// lib/sanity.ts
import { createClient } from 'next-sanity';
import { projectId, dataset, apiVersion } from '../sanity/env';

export const sanityClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true, // cached reads, safe for browser
  perspective: 'published',
});