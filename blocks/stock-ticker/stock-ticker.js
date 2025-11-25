export default async function decorate(block) {
  const container = document.createElement('div');
  container.className = 'stock-ticker-container';

  container.textContent = 'Loading stock price...';
  block.appendChild(container);

  const WORKER_URL = ' https://stock-ticker.prateeksml.workers.dev';

  async function loadPrice() {
    try {
      const response = await fetch(WORKER_URL);
      const data = await response.json();

      // Adjust based on actual JSON response structure
      const price =
        data?.data?.[0]?.lastSalePrice ||
        data?.price ||
        "N/A";

      container.innerHTML = `
        <span class="label">Stock Price:</span>
        <span class="price">$${price}</span>
      `;
    } catch (err) {
      console.error(err);
      container.textContent = "Failed to load stock price";
    }
  }

  loadPrice();

  // Refresh every 5 minutes
  setInterval(loadPrice, 5 * 60 * 1000);
}
