/**
 * Product Buyers back-office interactions.
 *
 * Data returned by the server is always inserted with textContent. This keeps
 * product and customer data from being interpreted as HTML.
 */
document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  const config = window.productBuyersConfig;
  const searchButton = document.getElementById('search_product_button');
  const productInput = document.getElementById('product_name');
  const resultsContainer = document.getElementById('productbuyers_results');

  if (!config || !searchButton || !productInput || !resultsContainer) {
    return;
  }

  const translations = config.translations || {};
  let activeRequest = null;

  const createElement = (tagName, options = {}) => {
    const element = document.createElement(tagName);

    if (options.className) {
      element.className = options.className;
    }

    if (options.text !== undefined) {
      element.textContent = String(options.text);
    }

    return element;
  };

  const renderMessage = (message, level = 'info') => {
    resultsContainer.replaceChildren(
      createElement('div', {
        className: `alert alert-${level}`,
        text: message,
      }),
    );
  };

  const createApiUrl = (action, parameters = {}) => {
    const url = new URL(config.ajaxUrl, window.location.href);
    url.searchParams.set('ajax', '1');
    url.searchParams.set('action', action);

    Object.entries(parameters).forEach(([key, value]) => {
      url.searchParams.set(key, String(value));
    });

    return url.toString();
  };

  const requestJson = async (action, parameters) => {
    if (activeRequest) {
      activeRequest.abort();
    }

    const requestController = new AbortController();
    activeRequest = requestController;

    try {
      const response = await fetch(createApiUrl(action, parameters), {
        credentials: 'same-origin',
        headers: {
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        signal: requestController.signal,
      });
      const payload = await response.json();

      if (!response.ok || payload.success !== true) {
        throw new Error(payload.error || translations.requestError);
      }

      return payload;
    } finally {
      if (activeRequest === requestController) {
        activeRequest = null;
      }
    }
  };

  const appendCell = (row, value) => {
    row.appendChild(createElement('td', {text: value}));
  };

  const createHeaderCell = (label) => {
    return createElement('th', {text: label});
  };

  const createSortableHeader = (label, key, onSort) => {
    const cell = createElement('th');
    const button = createElement('button', {
      className: 'productbuyers-sort',
    });
    const labelNode = createElement('span', {text: label});
    const icon = createElement('span', {
      className: 'productbuyers-sort-icon',
    });

    button.type = 'button';
    button.dataset.key = key;
    button.setAttribute('aria-sort', 'none');
    button.append(labelNode, icon);
    button.addEventListener('click', () => onSort(button));
    cell.appendChild(button);

    return cell;
  };

  const renderLimitWarning = (message) => {
    resultsContainer.appendChild(
      createElement('div', {
        className: 'alert alert-warning productbuyers-limit-warning',
        text: message,
      }),
    );
  };

  const compareValues = (left, right, key) => {
    if (key === 'purchase_count') {
      return Number(left[key]) - Number(right[key]);
    }

    return String(left[key] || '').localeCompare(
      String(right[key] || ''),
      document.documentElement.lang || undefined,
      {sensitivity: 'base'},
    );
  };

  const renderProductTable = (products, truncated) => {
    const sortedProducts = [...products];
    const table = createElement('table', {
      className: 'table table-striped table-hover productbuyers-table',
    });
    const head = createElement('thead');
    const headerRow = createElement('tr');
    const body = createElement('tbody');

    const renderRows = () => {
      body.replaceChildren();

      sortedProducts.forEach((product) => {
        const row = createElement('tr');
        const actionCell = createElement('td');
        const selectButton = createElement('button', {
          className: 'btn btn-primary btn-sm',
          text: translations.select,
        });

        selectButton.type = 'button';
        selectButton.addEventListener('click', () => loadBuyers(product.id_product));
        appendCell(row, product.name);
        appendCell(row, product.reference || '—');
        appendCell(row, product.purchase_count);
        actionCell.appendChild(selectButton);
        row.appendChild(actionCell);
        body.appendChild(row);
      });
    };

    const sort = (button) => {
      const currentDirection = button.getAttribute('aria-sort');
      const direction = currentDirection === 'ascending' ? 'descending' : 'ascending';

      table.querySelectorAll('.productbuyers-sort').forEach((sortButton) => {
        sortButton.setAttribute('aria-sort', 'none');
        sortButton.querySelector('.productbuyers-sort-icon').textContent = '';
      });

      button.setAttribute('aria-sort', direction);
      button.querySelector('.productbuyers-sort-icon').textContent =
        direction === 'ascending' ? '↑' : '↓';

      const factor = direction === 'ascending' ? 1 : -1;
      sortedProducts.sort(
        (left, right) => compareValues(left, right, button.dataset.key) * factor,
      );
      renderRows();
    };

    headerRow.append(
      createSortableHeader(translations.productName, 'name', sort),
      createSortableHeader(translations.reference, 'reference', sort),
      createSortableHeader(translations.purchaseCount, 'purchase_count', sort),
      createHeaderCell(translations.select),
    );
    head.appendChild(headerRow);
    table.append(head, body);
    renderRows();
    resultsContainer.replaceChildren(table);

    if (truncated) {
      renderLimitWarning(translations.searchLimit);
    }
  };

  const renderBuyerTable = (buyers, truncated) => {
    const table = createElement('table', {
      className: 'table table-striped table-hover productbuyers-table',
    });
    const head = createElement('thead');
    const headerRow = createElement('tr');
    const body = createElement('tbody');

    headerRow.append(
      createHeaderCell(translations.firstName),
      createHeaderCell(translations.lastName),
      createHeaderCell(translations.orderReference),
      createHeaderCell(translations.orderDate),
      createHeaderCell(translations.viewOrder),
    );

    buyers.forEach((buyer) => {
      const row = createElement('tr');
      const actionCell = createElement('td');
      const orderLink = createElement('a', {
        className: 'btn btn-secondary btn-sm',
        text: translations.viewOrder,
      });

      orderLink.href = buyer.order_url;
      orderLink.target = '_blank';
      orderLink.rel = 'noopener noreferrer';
      appendCell(row, buyer.firstname);
      appendCell(row, buyer.lastname);
      appendCell(row, buyer.order_reference || buyer.id_order);
      appendCell(row, buyer.date_add);
      actionCell.appendChild(orderLink);
      row.appendChild(actionCell);
      body.appendChild(row);
    });

    head.appendChild(headerRow);
    table.append(head, body);
    resultsContainer.replaceChildren(table);

    if (truncated) {
      renderLimitWarning(translations.buyerLimit);
    }
  };

  const loadBuyers = async (productId) => {
    renderMessage(translations.loadingBuyers, 'info');

    try {
      const payload = await requestJson('ProductBuyers', {
        id_product: productId,
      });

      if (payload.data.length === 0) {
        renderMessage(translations.noBuyers, 'info');
        return;
      }

      renderBuyerTable(payload.data, Boolean(payload.meta && payload.meta.truncated));
    } catch (error) {
      if (error.name !== 'AbortError') {
        renderMessage(error.message || translations.requestError, 'danger');
      }
    }
  };

  const searchProducts = async () => {
    const query = productInput.value.trim();

    if (!query) {
      renderMessage(translations.emptyQuery, 'warning');
      productInput.focus();
      return;
    }

    searchButton.disabled = true;
    resultsContainer.setAttribute('aria-busy', 'true');
    renderMessage(translations.searching, 'info');

    try {
      const payload = await requestJson('ProductSearch', {query});

      if (payload.data.length === 0) {
        renderMessage(translations.noProducts, 'info');
        return;
      }

      renderProductTable(payload.data, Boolean(payload.meta && payload.meta.truncated));
    } catch (error) {
      if (error.name !== 'AbortError') {
        renderMessage(error.message || translations.requestError, 'danger');
      }
    } finally {
      searchButton.disabled = false;
      resultsContainer.removeAttribute('aria-busy');
    }
  };

  searchButton.addEventListener('click', searchProducts);
  productInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      searchProducts();
    }
  });
});
