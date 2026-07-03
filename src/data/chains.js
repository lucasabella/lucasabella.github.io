import bagelsAndBeans from './chains/bagels-and-beans.json';
import dunkin from './chains/dunkin.json';
import febo from './chains/febo.json';
import laplace from './chains/laplace.json';
import loetje from './chains/loetje.json';
import sumo from './chains/sumo.json';

const chains = [bagelsAndBeans, dunkin, febo, laplace, loetje, sumo]
  .map((c) => ({
    slug: c.slug,
    name: c.chain,
    description: c.description,
    website: c.website,
    logo_url: c.logo_url,
    locations: c.locations,
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

export function getChains() {
  return chains;
}

export function getChain(slug) {
  return chains.find((c) => c.slug === slug) || null;
}
