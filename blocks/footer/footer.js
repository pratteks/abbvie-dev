import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);

  // decorate footer DOM
  block.textContent = '';
  const rows = [...block.children];

  const brand = rows[0]?.innerText.trim();
  const col1 = rows[1];
  const col2 = rows[2];
  const col3 = rows[3];
  const legal = rows[4];
  const privacy = rows[5];

  const footer = document.createElement('footer');
  footer.classList.add('footer');

  // Top grid section
  const top = document.createElement('div');
  top.classList.add('footer-top');

  const brandDiv = document.createElement('div');
  brandDiv.classList.add('footer-brand');
  brandDiv.textContent = brand;

  const columnWrapper = document.createElement('div');
  columnWrapper.classList.add('footer-columns');

  [col1, col2, col3].forEach(col => {
    const colDiv = document.createElement('div');
    colDiv.classList.add('footer-col');
    colDiv.innerHTML = col.innerHTML;
    columnWrapper.append(colDiv);
  });

  top.append(brandDiv, columnWrapper);

  // Bottom legal section
  const bottom = document.createElement('div');
  bottom.classList.add('footer-bottom');

  const legalDiv = document.createElement('div');
  legalDiv.classList.add('footer-legal');
  legalDiv.innerHTML = legal.innerHTML;

  const privacyDiv = document.createElement('div');
  privacyDiv.classList.add('footer-privacy');
  privacyDiv.innerHTML = privacy.innerHTML;

  bottom.append(legalDiv, privacyDiv);

  footer.append(top, bottom);

  block.replaceWith(footer);
}
