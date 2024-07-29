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
            e.preventDefault();  // Empêcher la soumission de formulaire par défaut
            searchProducts();
        });
    }

    productNameInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();  // Empêcher la soumission de formulaire par défaut
            searchProducts();
        }
    });

    function displaySearchResults(products) {
        resultsContainer.innerHTML = '<table class="table table-bordered"><thead class="thead-light"><tr><th>Product Name</th><th>Select</th></tr></thead><tbody></tbody></table>';
        const tbody = resultsContainer.querySelector('tbody');
        products.forEach(product => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${product.name}</td>
                <td><button class="btn btn-primary select_product" data-id="${product.id_product}">Select</button></td>
            `;
            tbody.appendChild(row);
        });

        document.querySelectorAll('.select_product').forEach(button => {
            button.addEventListener('click', function (e) {
                e.preventDefault();  // Empêcher toute action par défaut
                const productId = this.getAttribute('data-id');
                fetchProductBuyers(productId);
            });
        });
    }

    function fetchProductBuyers(productId) {
        const buyersUri = `${baseUri.replace('ProductSearch&query=', 'ProductBuyers&id_product=')}${productId}`;
        console.log('Fetching buyers from:', buyersUri);  // Ajoutez ceci pour déboguer l'URL
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
