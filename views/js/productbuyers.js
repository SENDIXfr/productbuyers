document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('search_product_button').addEventListener('click', function () {
        var query = document.getElementById('product_name').value;
        if (!query) {
            alert('Please enter a product name');
            return;
        }

        var xhr = new XMLHttpRequest();
        xhr.open('GET', baseUri + '?fc=module&module=productbuyers&controller=ajaxProductSearch&query=' + encodeURIComponent(query), true);
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && xhr.status === 200) {
                var response = JSON.parse(xhr.responseText);
                if (response.error) {
                    alert(response.error);
                } else {
                    var resultsDiv = document.getElementById('search_results');
                    if (!resultsDiv) {
                        resultsDiv = document.createElement('div');
                        resultsDiv.id = 'search_results';
                        document.getElementById('product_name').parentNode.appendChild(resultsDiv);
                    }
                    var table = '<table class="table"><thead><tr><th>Product ID</th><th>Product Name</th></tr></thead><tbody>';
                    response.forEach(function (product) {
                        table += '<tr><td>' + product.id_product + '</td><td>' + product.name + '</td></tr>';
                    });
                    table += '</tbody></table>';
                    resultsDiv.innerHTML = table;
                }
            }
        };
        xhr.send();
    });
});
