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
  let cachedProducts = [];
  let cachedSearchWasTruncated = false;

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

  const renderError = (message, retryAction, backAction) => {
    const alert = createElement('div', {className: 'alert alert-danger'});
    const text = createElement('p', {text: message});
    const actions = createElement('div', {className: 'productbuyers-actions'});

    if (typeof retryAction === 'function') {
      const retryButton = createElement('button', {
        className: 'btn btn-primary btn-sm',
        text: translations.retry,
      });
      retryButton.type = 'button';
      retryButton.addEventListener('click', retryAction);
      actions.appendChild(retryButton);
    }

    if (typeof backAction === 'function') {
      const backButton = createElement('button', {
        className: 'btn btn-secondary btn-sm',
        text: translations.backToProducts,
      });
      backButton.type = 'button';
      backButton.addEventListener('click', backAction);
      actions.appendChild(backButton);
    }

    alert.append(text, actions);
    resultsContainer.replaceChildren(alert);
    const recoveryButton = alert.querySelector('button');
    if (recoveryButton) {
      recoveryButton.focus();
    }
  };

  const renderLoading = (message, backAction) => {
    const alert = createElement('div', {className: 'alert alert-info'});
    alert.setAttribute('role', 'status');
    alert.appendChild(createElement('span', {text: message}));

    if (typeof backAction === 'function') {
      const backButton = createElement('button', {
        className: 'btn btn-secondary btn-sm productbuyers-back-button',
        text: translations.backToProducts,
      });
      backButton.type = 'button';
      backButton.addEventListener('click', backAction);
      alert.appendChild(backButton);
    }

    resultsContainer.replaceChildren(alert);
    resultsContainer.setAttribute('aria-busy', 'true');
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

      if (response.status === 401) {
        throw new Error(translations.sessionExpired || translations.requestError);
      }

      if (response.status === 403) {
        throw new Error(translations.accessDenied || translations.requestError);
      }

      const payload = await response.json().catch(() => null);

      if (!payload || !response.ok || payload.success !== true) {
        throw new Error((payload && payload.error) || translations.requestError);
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
    const cell = createElement('th', {text: label});
    cell.scope = 'col';
    return cell;
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
    icon.setAttribute('aria-hidden', 'true');

    button.type = 'button';
    button.dataset.key = key;
    button.append(labelNode, icon);
    cell.scope = 'col';
    cell.setAttribute('aria-sort', 'none');
    button.addEventListener('click', () => onSort(cell, button));
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
    const caption = table.createCaption();
    caption.className = 'sr-only';
    caption.textContent = translations.productsCaption;

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
        selectButton.addEventListener('click', () => loadBuyers(product.id_product, selectButton));
        appendCell(row, product.name);
        appendCell(row, product.reference || '—');
        appendCell(row, product.purchase_count);
        actionCell.appendChild(selectButton);
        row.appendChild(actionCell);
        body.appendChild(row);
      });
    };

    const sort = (headerCell, button) => {
      const currentDirection = headerCell.getAttribute('aria-sort');
      const direction = currentDirection === 'ascending' ? 'descending' : 'ascending';

      table.querySelectorAll('.productbuyers-sort').forEach((sortButton) => {
        sortButton.closest('th').setAttribute('aria-sort', 'none');
      });

      headerCell.setAttribute('aria-sort', direction);

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
    const caption = table.createCaption();
    caption.className = 'sr-only';
    caption.textContent = translations.buyersCaption;
    const navigation = createElement('div', {className: 'productbuyers-table-navigation'});
    const backButton = createElement('button', {
      className: 'btn btn-secondary btn-sm productbuyers-back-button',
      text: translations.backToProducts,
    });
    backButton.type = 'button';
    backButton.addEventListener('click', showCachedProducts);
    navigation.appendChild(backButton);

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
    resultsContainer.replaceChildren(navigation, table);
    resultsContainer.removeAttribute('aria-busy');
    backButton.focus();

    if (truncated) {
      renderLimitWarning(translations.buyerLimit);
    }
  };

  const showCachedProducts = () => {
    if (activeRequest) {
      activeRequest.abort();
      activeRequest = null;
    }

    resultsContainer.removeAttribute('aria-busy');

    if (cachedProducts.length > 0) {
      renderProductTable(cachedProducts, cachedSearchWasTruncated);
      const firstAction = resultsContainer.querySelector('.productbuyers-table tbody button');
      if (firstAction) {
        firstAction.focus();
      }
    } else {
      productInput.focus();
      productInput.select();
    }
  };

  const loadBuyers = async (productId, triggerButton) => {
    if (triggerButton) {
      triggerButton.disabled = true;
    }

    renderLoading(translations.loadingBuyers, showCachedProducts);

    try {
      const payload = await requestJson('ProductBuyers', {
        id_product: productId,
      });

      if (payload.data.length === 0) {
        renderMessage(translations.noBuyers, 'info');
        const backButton = createElement('button', {
          className: 'btn btn-secondary btn-sm productbuyers-back-button',
          text: translations.backToProducts,
        });
        backButton.type = 'button';
        backButton.addEventListener('click', showCachedProducts);
        resultsContainer.firstElementChild.appendChild(backButton);
        backButton.focus();
        return;
      }

      renderBuyerTable(payload.data, Boolean(payload.meta && payload.meta.truncated));
    } catch (error) {
      if (error.name !== 'AbortError') {
        const message = error instanceof TypeError
          ? translations.requestError
          : (error.message || translations.requestError);
        renderError(message, () => loadBuyers(productId), showCachedProducts);
      }
    } finally {
      if (triggerButton) {
        triggerButton.disabled = false;
      }
      if (!activeRequest) {
        resultsContainer.removeAttribute('aria-busy');
      }
    }
  };

  const searchProducts = async () => {
    if (searchButton.disabled) {
      return;
    }

    const query = productInput.value.trim();

    if (!query) {
      renderMessage(translations.emptyQuery, 'warning');
      productInput.focus();
      return;
    }

    searchButton.disabled = true;
    renderLoading(translations.searching);

    try {
      const payload = await requestJson('ProductSearch', {query});

      if (payload.data.length === 0) {
        cachedProducts = [];
        cachedSearchWasTruncated = false;
        renderMessage(translations.noProducts, 'info');
        return;
      }

      cachedProducts = payload.data;
      cachedSearchWasTruncated = Boolean(payload.meta && payload.meta.truncated);
      renderProductTable(payload.data, Boolean(payload.meta && payload.meta.truncated));
    } catch (error) {
      if (error.name !== 'AbortError') {
        const message = error instanceof TypeError
          ? translations.requestError
          : (error.message || translations.requestError);
        renderError(message, searchProducts);
      }
    } finally {
      searchButton.disabled = false;
      if (!activeRequest) {
        resultsContainer.removeAttribute('aria-busy');
      }
    }
  };

  searchButton.addEventListener('click', searchProducts);
  productInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !searchButton.disabled) {
      event.preventDefault();
      searchProducts();
    }
  });
});
