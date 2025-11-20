import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * Footer Fragment Block Renderer
 */
export default async function decorate(block) {
  // Read footer="" metadata
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';

  // Load the fragment HTML
  const fragment = await loadFragment(footerPath);

  // ---- Extract sections from fragment -------------------------

  // 1️⃣ Columns section (<div class="columns block columns-4-cols">)
  const columnsBlock = fragment.querySelector('.columns.block');
  const columnCells = [...columnsBlock.querySelectorAll(':scope > div > div')];

  const brandCell = columnCells[0];
  const col1Cell  = columnCells[1];
  const col2Cell  = columnCells[2];
  const col3Cell  = columnCells[3];

  // Extract legal paragraphs (found inside col3)
  const legalParas = col3Cell.querySelectorAll('p:not(.button-container):not(:has(a))');

  // 2️⃣ Legal links section (bottom)
  const legalWrapper = fragment.querySelector('.default-content-wrapper');
  const legalLinksUl = legalWrapper.querySelector('ul');
  const privacyLink  = legalWrapper.querySelector('p a');

  // ---- Build final footer DOM --------------------------------

  const footer = document.createElement('footer');
  footer.classList.add('footer');

  // Top grid
  const top = document.createElement('div');
  top.classList.add('footer-top');

  // Brand
  const brand = document.createElement('div');
  brand.classList.add('footer-brand');
  brand.textContent = brandCell.innerText.trim();

  // Columns wrapper
  const columns = document.createElement('div');
  columns.classList.add('footer-columns');

  // Helper: convert a <div> group into a real column
  const makeColumn = (cell) => {
    const col = document.createElement('div');
    col.classList.add('footer-col');

    // Copy all inner HTML INCLUDING links
    col.innerHTML = cell.innerHTML;

    return col;
  };

  columns.append(
    makeColumn(col1Cell),
    makeColumn(col2Cell),
    makeColumn(col3Cell)
  );

  top.append(brand, columns);

  // Bottom legal wrapper
  const bottom = document.createElement('div');
  bottom.classList.add('footer-bottom');

  // Legal paragraphs
  const legalDiv = document.createElement('div');
  legalDiv.classList.add('footer-legal');

  legalParas.forEach(p => {
    const np = document.createElement('p');
    np.innerHTML = p.innerHTML;
    legalDiv.append(np);
  });

  // Legal links
  const legalLinksDiv = document.createElement('div');
  legalLinksDiv.classList.add('footer-legal-links');
  legalLinksDiv.innerHTML = legalLinksUl.outerHTML;

  // Privacy
  const privacyDiv = document.createElement('div');
  privacyDiv.classList.add('footer-privacy');
  privacyDiv.innerHTML = `<a href="${privacyLink.href}">${privacyLink.textContent}</a>`;

  bottom.append(legalDiv, legalLinksDiv, privacyDiv);

  // Replace block content with the fully constructed footer
  block.replaceWith(footer);

  footer.append(top, bottom);
}
