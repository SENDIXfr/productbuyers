document.addEventListener('DOMContentLoaded', function () {
    const searchButton = document.getElementById('search_product_button');
    const productNameInput = document.getElementById('product_name');
    const resultsContainer = document.createElement('div');
    resultsContainer.setAttribute('id', 'search_results');
    searchButton.parentNode.appendChild(resultsContainer);

    function searchProducts() {
        const query = productNameInput.value;
        if (query) {
            fetch(baseUri + encodeURIComponent(query))
                .then(response => response.json())
                .then(data => {
                    if (data.error) {
                        resultsContainer.innerHTML = `<p>${data.error}</p>`;
                    } else {
                        displaySearchResults(data);
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    resultsContainer.innerHTML = '<p>An error occurred while searching for products.</p>';
                });
        }
    }

    if (searchButton) {
        searchButton.addEventListener('click', function (e) {
            e.preventDefault();  
            searchProducts();
        });
    }

    productNameInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault(); 
            searchProducts();
        }
    });

function displaySearchResults(products) {
    resultsContainer.innerHTML = `
        <table class="table table-bordered">
            <thead class="thead-light">
                <tr>
                    <th data-sort="name">Product Name <span class="sort-icon"></span></th>
                    <th data-sort="purchase_count">Number of Purchases <span class="sort-icon"></span></th>
                    <th>Select</th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>
    `;

    const tbody = resultsContainer.querySelector('tbody');
    renderTableRows(products, tbody);

    const headers = resultsContainer.querySelectorAll('th[data-sort]');
    headers.forEach(header => {
        header.addEventListener('click', () => {
            const sortKey = header.getAttribute('data-sort');
            
            const isAsc = header.classList.contains('asc');
            headers.forEach(h => {
                h.classList.remove('asc', 'desc');
            });
            
            if (isAsc) {
                header.classList.add('desc');
            } else {
                header.classList.add('asc');
            }
            
            sortProducts(products, sortKey, !isAsc);
            renderTableRows(products, tbody);
        });
    });
}


function renderTableRows(products, tbody) {
    tbody.innerHTML = '';
    products.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.name}</td>
            <td>${product.purchase_count}</td>
            <td><button class="btn btn-primary select_product" data-id="${product.id_product}">Select</button></td>
        `;
        tbody.appendChild(row);
    });

    document.querySelectorAll('.select_product').forEach(button => {
        button.addEventListener('click', function (e) {
            e.preventDefault();
            const productId = this.getAttribute('data-id');
            fetchProductBuyers(productId);
        });
    });
}

function sortProducts(products, key, isAsc) {
    products.sort((a, b) => {
        if (a[key] < b[key]) return isAsc ? -1 : 1;
        if (a[key] > b[key]) return isAsc ? 1 : -1;
        return 0;
    });
}
    function fetchProductBuyers(productId) {
        const buyersUri = `${baseUri.replace('ProductSearch&query=', 'ProductBuyers&id_product=')}${productId}`;
        fetch(buyersUri)
            .then(response => {
                if (!response.ok) {
                    return response.text().then(text => {
                        console.error('Server Error:', text);
                        throw new Error('Network response was not ok');
                    });
                }
                return response.json();
            })
            .then(data => {
                if (data.error) {
                    resultsContainer.innerHTML = `<p>${data.error}</p>`;
                } else {
                    displayProductBuyers(data);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                resultsContainer.innerHTML = '<p>An error occurred while fetching product buyers.</p>';
            });
    }

    function displayProductBuyers(buyers) {
        const productbuyers_translation_first_name = 'First Name';
        const productbuyers_translation_last_name = 'Last Name';
        const productbuyers_translation_order_id = 'Order ID';
        const productbuyers_translation_order_link = 'Order Link';
        const productbuyers_translation_view_order = 'View Order';

        let html = '<table class="table table-striped">';
        html += `
            <thead>
                <tr>
                    <th>${productbuyers_translation_first_name}</th>
                    <th>${productbuyers_translation_last_name}</th>
                    <th>${productbuyers_translation_order_id}</th>
                    <th>${productbuyers_translation_order_link}</th>
                </tr>
            </thead>
            <tbody>
        `;

        buyers.forEach(buyer => {
            const getOrderLink = (orderId) => {
                return orderLinknew.replace('/0/', `/${orderId}/`);
            };

            const orderLink = getOrderLink(buyer.id_order);
            html += `
                <tr>
                    <td>${buyer.firstname}</td>
                    <td>${buyer.lastname}</td>
                    <td>${buyer.id_order}</td>
                    <td><a href="${orderLink}" class="btn btn-secondary" target="_blank">${productbuyers_translation_view_order}</a></td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        resultsContainer.innerHTML = html;
    }
});
