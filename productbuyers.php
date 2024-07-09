<?php
if (!defined('_PS_VERSION_')) {
    exit;
}

class ProductBuyers extends Module
{
    public function __construct()
    {
        $this->name = 'productbuyers';
        $this->tab = 'administration';
        $this->version = '0.6.0';
        $this->author = 'SENDIX';
        $this->ps_versions_compliancy = array('min' => '1.7.0.0', 'max' => _PS_VERSION_);
        $this->need_instance = 0;
        $this->bootstrap = true;

        parent::__construct();

        $this->displayName = $this->l('Product Buyers');
        $this->description = $this->l('Displays a list of customers who bought a specific product.');

        $this->confirmUninstall = $this->l('Are you sure you want to uninstall?');
    }

    public function install()
    {
        return parent::install() && $this->registerHook('displayBackOfficeHeader');
    }

    public function hookBackOfficeHeader()
    {
        $this->context->controller->addJS($this->_path . 'views/js/productbuyers.js');
        Media::addJsDef(array(
            'baseUri' => $this->context->link->getAdminLink('AdminModules', true) . '&configure=' . $this->name . '&ajax=1&action=ProductSearch&query='
        ));
    }

    public function getContent()
    {
        $output = '';

        if (Tools::isSubmit('submit_productbuyers')) {
            $productId = (int)Tools::getValue('PRODUCT_ID');
            $output .= $this->displayProductBuyers($productId);
        }

        return $output . $this->displayForm();
    }

    public function displayForm()
    {
        $defaultLang = (int)Configuration::get('PS_LANG_DEFAULT');

        $fieldsForm[0]['form'] = array(
            'legend' => array(
                'title' => $this->l('Search Product by Name or Reference'),
                'icon' => 'icon-search'
            ),
            'input' => array(
                array(
                    'type' => 'text',
                    'label' => $this->l('Product Name or Reference'),
                    'name' => 'PRODUCT_NAME',
                    'size' => 20,
                    'required' => true,
                    'id' => 'product_name',
                    'class' => 'form-control'
                ),
            ),
            'buttons' => array(
                array(
                    'type' => 'button',
                    'title' => $this->l('Search'),
                    'class' => 'btn btn-primary pull-right',
                    'id' => 'search_product_button'
                ),
            )
        );

        $fieldsForm[1]['form'] = array(
            'legend' => array(
                'title' => $this->l('Enter Product ID'),
                'icon' => 'icon-cogs'
            ),
            'input' => array(
                array(
                    'type' => 'text',
                    'label' => $this->l('Product ID'),
                    'name' => 'PRODUCT_ID',
                    'size' => 20,
                    'required' => true,
                    'class' => 'form-control'
                ),
            ),
            'submit' => array(
                'title' => $this->l('Search'),
                'class' => 'btn btn-primary pull-right'
            )
        );

        $helper = new HelperForm();

        $helper->show_toolbar = false;
        $helper->table = $this->table;
        $helper->module = $this;
        $helper->default_form_language = $defaultLang;
        $helper->allow_employee_form_lang = $defaultLang;
        $helper->identifier = $this->identifier;
        $helper->submit_action = 'submit_productbuyers';
        $helper->currentIndex = $this->context->link->getAdminLink('AdminModules', false) . '&configure=' . $this->name . '&tab_module=' . $this->tab . '&module_name=' . $this->name;
        $helper->token = Tools::getAdminTokenLite('AdminModules');

        return $helper->generateForm($fieldsForm);
    }

    public function displayProductBuyers($productId)
    {
        if (!$productId) {
            return $this->displayError($this->l('Invalid product ID'));
        }

        $sql = new DbQuery();
        $sql->select('c.firstname, c.lastname, o.id_order');
        $sql->from('orders', 'o');
        $sql->leftJoin('order_detail', 'od', 'o.id_order = od.id_order');
        $sql->leftJoin('customer', 'c', 'o.id_customer = c.id_customer');
        $sql->where('od.product_id = ' . (int)$productId);
        $results = Db::getInstance()->executeS($sql);

        if (!$results) {
            return $this->displayError($this->l('No buyers found for this product'));
        }

        $html = '<table class="table table-bordered">';
        $html .= '<thead class="thead-light"><tr><th>' . $this->l('First Name') . '</th><th>' . $this->l('Last Name') . '</th><th>' . $this->l('Order ID') . '</th><th>' . $this->l('Order Link') . '</th></tr></thead>';
        $html .= '<tbody>';
        foreach ($results as $row) {
            $orderLink = $this->context->link->getAdminLink('AdminOrders', true, [], [
                'id_order' => (int)$row['id_order'],
                'vieworder' => 1
            ]);
            $html .= '<tr><td>' . htmlspecialchars($row['firstname']) . '</td><td>' . htmlspecialchars($row['lastname']) . '</td><td>' . (int)$row['id_order'] . '</td><td><a href="' . $orderLink . '" class="btn btn-secondary" target="_blank">' . $this->l('View Order') . '</a></td></tr>';
        }
        $html .= '</tbody></table>';

        return $html;
    }

    public function ajaxProcessProductSearch()
    {
        $query = Tools::getValue('query');

        if (!$query) {
            die(json_encode(['error' => 'Query is empty']));
        }

        $sql = 'SELECT p.id_product, pl.name
                FROM ' . _DB_PREFIX_ . 'product p
                LEFT JOIN ' . _DB_PREFIX_ . 'product_lang pl ON (p.id_product = pl.id_product)
                WHERE (pl.name LIKE \'%' . pSQL($query) . '%\' OR p.reference LIKE \'%' . pSQL($query) . '%\')
                AND pl.id_lang = ' . (int)$this->context->language->id;

        $results = Db::getInstance()->executeS($sql);

        if (empty($results)) {
            die(json_encode(['error' => 'No products found']));
        }

        die(json_encode($results));
    }
}
