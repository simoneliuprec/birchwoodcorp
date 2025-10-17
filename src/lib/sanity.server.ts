// lib/sanity.server.ts
import { createClient } from 'next-sanity';
import { projectId, dataset, apiVersion, sanityWriteToken } from '../sanity/env';

export const sanityWriteClient = createClient({
  projectId,
  dataset,
  apiVersion,
  token: sanityWriteToken, // never exposed to client
  useCdn: false,
});