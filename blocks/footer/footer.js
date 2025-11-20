import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

export default async function decorate(block) {
  // Load fragment based on metadata
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);

  // Extract DOM parts
  const columnsContainer = fragment.querySelector('.columns-container');
  if (!columnsContainer) return;

  const columns = columnsContainer.querySelector('.columns.block');
  const row = columns?.querySelector('div');
  const bottom = fragment.querySelector('.default-content-wrapper');

  if (!row || !bottom) return;

  const cols = [...row.children];

  const brand = cols[0]?.innerHTML || '';
  const col1 = cols[1]?.innerHTML || '';
  const col2 = cols[2]?.innerHTML || '';
  const col3 = cols[3]?.innerHTML || '';

  const bottomLinks = bottom.querySelector('ul')?.innerHTML || '';
  const privacy = bottom.querySelector('p')?.innerHTML || '';

  // Build footer
  const footer = document.createElement('footer');
  footer.classList.add('footer');

  footer.innerHTML = `
    <div class="footer-top">
      <div class="footer-brand">
        ${brand}
      </div>
      <div class="footer-columns">
        <div class="footer-col">${col1}</div>
        <div class="footer-col">${col2}</div>
        <div class="footer-col">${col3}</div>
      </div>
    </div>

    <div class="footer-bottom">
      <ul class="footer-links">
        ${bottomLinks}
      </ul>
      <div class="footer-privacy">
        ${privacy}
      </div>
    </div>
  `;

  // Replace the block
  block.replaceWith(footer);
}
