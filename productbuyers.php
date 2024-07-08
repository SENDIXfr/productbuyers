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
        $this->version = '0.4.0';
        $this->author = 'SENDIX';
        $this->need_instance = 0;

        parent::__construct();

        $this->displayName = $this->l('Product Buyers');
        $this->description = $this->l('Displays a list of customers who bought a specific product.');

        $this->confirmUninstall = $this->l('Are you sure you want to uninstall?');
    }

    public function install()
    {
        return parent::install() && $this->registerHook('displayBackOfficeHeader');
    }

    public function getContent()
    {
        $output = '';
        if (Tools::isSubmit('submit_productbuyers')) {
            $productId = (int)Tools::getValue('PRODUCT_ID');
            $output .= $this->displayBuyers($productId);
        }

        return $output . $this->displayForm();
    }

    public function displayForm()
    {
        $defaultLang = (int)Configuration::get('PS_LANG_DEFAULT');

        $fieldsForm[0]['form'] = array(
            'legend' => array(
                'title' => $this->l('Enter Product ID'),
            ),
            'input' => array(
                array(
                    'type' => 'text',
                    'label' => $this->l('Product ID'),
                    'name' => 'PRODUCT_ID',
                    'size' => 20,
                    'required' => true
                ),
            ),
            'submit' => array(
                'title' => $this->l('Search'),
                'class' => 'btn btn-default pull-right'
            )
        );

        $fieldsForm[1]['form'] = array(
            'legend' => array(
                'title' => $this->l('Search Product by Name'),
            ),
            'input' => array(
                array(
                    'type' => 'text',
                    'label' => $this->l('Product Name'),
                    'name' => 'PRODUCT_NAME',
                    'size' => 20,
                    'required' => true,
                    'id' => 'product_name'
                ),
            ),
            'button' => array(
                'type' => 'button',
                'class' => 'btn btn-default pull-right',
                'id' => 'search_product_button',
                'title' => $this->l('Search')
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
        $helper->currentIndex = $this->context->link->getAdminLink('AdminModules', false)
            . '&configure=' . $this->name . '&tab_module=' . $this->tab . '&module_name=' . $this->name;
        $helper->token = Tools::getAdminTokenLite('AdminModules');

        $this->context->controller->addJS($this->_path.'views/js/productbuyers.js');

        return $helper->generateForm($fieldsForm);
    }

    public function displayBuyers($productId)
    {
        if ($productId <= 0) {
            return $this->displayError($this->l('Invalid Product ID.'));
        }

        $sql = new DbQuery();
        $sql->select('c.id_customer, c.firstname, c.lastname, c.email, o.id_order');
        $sql->from('orders', 'o');
        $sql->innerJoin('order_detail', 'od', 'o.id_order = od.id_order');
        $sql->innerJoin('customer', 'c', 'o.id_customer = c.id_customer');
        $sql->where('od.product_id = ' . (int)$productId);
        
        $customers = Db::getInstance()->executeS($sql);

        if (!$customers) {
            return $this->displayError($this->l('No customers found for this product.'));
        }

        $output = '<table class="table">';
        $output .= '<thead><tr><th>' . $this->l('Customer ID') . '</th><th>' . $this->l('First Name') . '</th><th>' . $this->l('Last Name') . '</th><th>' . $this->l('Email') . '</th><th>' . $this->l('Order ID') . '</th></tr></thead>';
        $output .= '<tbody>';
        foreach ($customers as $customer) {
            $output .= '<tr>';
            $output .= '<td>' . (int)$customer['id_customer'] . '</td>';
            $output .= '<td>' . htmlspecialchars($customer['firstname']) . '</td>';
            $output .= '<td>' . htmlspecialchars($customer['lastname']) . '</td>';
            $output .= '<td>' . htmlspecialchars($customer['email']) . '</td>';
            $output .= '<td>' . (int)$customer['id_order'] . '</td>';
            $output .= '</tr>';
        }
        $output .= '</tbody>';
        $output .= '</table>';

        return $output;
    }
}
