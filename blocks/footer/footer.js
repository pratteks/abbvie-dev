import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

export default async function decorate(block) {
  // Load fragment path from <meta name="footer">
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta
    ? new URL(footerMeta, window.location).pathname
    : '/footer';

  const fragment = await loadFragment(footerPath);

  // --- Extract columns section ---
  const columnsSection = fragment.querySelector('.columns-wrapper .columns');
  const columns = columnsSection?.querySelector('div')?.children || [];

  const brand = columns[0]?.querySelector('p')?.textContent?.trim() || '';

  const col1 = columns[0]?.children[1];
  const col2 = columns[0]?.children[2];
  const col3 = columns[0]?.children[3];

  const legalTextEls = col3?.querySelectorAll('p') || [];

  const legalMain = legalTextEls[legalTextEls.length - 2]?.outerHTML || '';
  const copyright = legalTextEls[legalTextEls.length - 1]?.outerHTML || '';

  // --- Extract bottom links section ---
  const bottomSection = fragment.querySelector('.default-content-wrapper');
  const linkList = bottomSection?.querySelector('ul');
  const privacyChoiceBtn = bottomSection?.querySelector('.button-container');

  // Build footer DOM
  const footer = document.createElement('footer');
  footer.classList.add('footer');

  /* ----------------------
     Top Section
  ---------------------- */
  const top = document.createElement('div');
  top.classList.add('footer-top');

  const brandDiv = document.createElement('div');
  brandDiv.classList.add('footer-brand');
  brandDiv.textContent = brand;

  const colWrapper = document.createElement('div');
  colWrapper.classList.add('footer-columns');

  [col1, col2, col3].forEach((col) => {
    const c = document.createElement('div');
    c.classList.add('footer-col');
    c.innerHTML = col?.innerHTML || '';
    colWrapper.append(c);
  });

  top.append(brandDiv, colWrapper);

  /* ----------------------
     Bottom Section
  ---------------------- */
  const bottom = document.createElement('div');
  bottom.classList.add('footer-bottom');

  const linksDiv = document.createElement('div');
  linksDiv.classList.add('footer-links');
  linksDiv.innerHTML = linkList?.outerHTML || '';

  const privacyDiv = document.createElement('div');
  privacyDiv.classList.add('footer-privacy-btn');
  privacyDiv.innerHTML = privacyChoiceBtn?.outerHTML || '';

  const legalDiv = document.createElement('div');
  legalDiv.classList.add('footer-legal');
  legalDiv.innerHTML = legalMain + copyright;

  bottom.append(linksDiv, privacyDiv, legalDiv);

  // Replace original block with assembled HTML
  block.replaceWith(footer);
}