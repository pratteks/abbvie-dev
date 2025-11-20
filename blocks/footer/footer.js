import { getMetadata } from '../../scripts/aem.js';

import { loadFragment } from '../fragment/fragment.js';

export default async function decorate(block) {
  // load footer fragment
  const footerPath = '/footer'; // or metadata-driven if needed
  const fragment = await loadFragment(footerPath);

  // extract the main block root inside fragment
  const section = fragment.querySelector('.section');
  if (!section) return;

  const columnsWrapper = section.querySelector('.columns-wrapper .columns > div');
  const bottomWrapper = section.querySelector('.default-content-wrapper');

  if (!columnsWrapper) return;

  const cols = [...columnsWrapper.children];

  // Expected HTML:
  // col[0] = brand
  // col[1], col[2], col[3] = link groups
  const brandCol = cols[0];
  const col1 = cols[1];
  const col2 = cols[2];
  const col3 = cols[3];

  // Build final footer structure
  const footer = document.createElement('footer');
  footer.classList.add('abbvie-footer');

  /* -------------------------------
     TOP SECTION for footer bbbb
  -------------------------------- */
  const top = document.createElement('div');
  top.classList.add('footer-top');

  const brandDiv = document.createElement('div');
  brandDiv.classList.add('footer-brand');
  brandDiv.innerHTML = brandCol.innerHTML;

  const colsContainer = document.createElement('div');
  colsContainer.classList.add('footer-columns');

  [col1, col2, col3].forEach((c) => {
    const colDiv = document.createElement('div');
    colDiv.classList.add('footer-col');
    colDiv.innerHTML = c.innerHTML;
    colsContainer.appendChild(colDiv);
  });

  top.append(brandDiv, colsContainer);

  /* -------------------------------
     BOTTOM SECTION
  -------------------------------- */
  const bottom = document.createElement('div');
  bottom.classList.add('footer-bottom');

  if (bottomWrapper) {
    // UL links
    const ul = bottomWrapper.querySelector('ul');
    if (ul) {
      const linkList = document.createElement('div');
      linkList.classList.add('footer-links');
      linkList.innerHTML = ul.outerHTML;
      bottom.append(linkList);
    }

    // CTA button
    const button = bottomWrapper.querySelector('.button-container');
    if (button) {
      const ctaDiv = document.createElement('div');
      ctaDiv.classList.add('footer-cta');
      ctaDiv.innerHTML = button.outerHTML;
      bottom.append(ctaDiv);
    }
  }

  footer.append(top, bottom);

  // replace placeholder block with final footer
  block.replaceWith(footer);
}
