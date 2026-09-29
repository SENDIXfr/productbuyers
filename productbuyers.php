<?php
/**
 * Copyright since 2007 PrestaShop SA and Contributors
 * PrestaShop is an International Registered Trademark & Property of PrestaShop SA
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Academic Free License version 3.0
 * that is bundled with this package in the file LICENSE.md.
 * It is also available through the world-wide-web at this URL:
 * https://opensource.org/licenses/AFL-3.0
 *
 * @author    SENDIX
 * @copyright Since 2024 SENDIX
 * @license   https://opensource.org/licenses/AFL-3.0 Academic Free License version 3.0
 */

if (!defined('_PS_VERSION_')) {
    exit;
}

class ProductBuyers extends Module
{
    private const MAX_SEARCH_RESULTS = 50;
    private const MAX_BUYER_RESULTS = 500;

    /** @var bool */
    private $assetsRegistered = false;

    public function __construct()
    {
        $this->name = 'productbuyers';
        $this->tab = 'administration';
        $this->version = '1.0.1';
        $this->author = 'SENDIX';
        $this->ps_versions_compliancy = [
            'min' => '8.0.0',
            'max' => '9.1.99',
        ];
        $this->need_instance = 0;
        $this->bootstrap = true;

        parent::__construct();

        $this->displayName = $this->trans('Product buyers', [], 'Modules.Productbuyers.Admin');
        $this->description = $this->trans(
            'Displays the customers who bought a specific product.',
            [],
            'Modules.Productbuyers.Admin'
        );
        $this->confirmUninstall = $this->trans(
            'Are you sure you want to uninstall this module?',
            [],
            'Modules.Productbuyers.Admin'
        );
    }

    public function install()
    {
        return parent::install()
            && $this->registerHook('displayBackOfficeHeader');
    }

    /**
     * Loads the assets only on this module configuration page.
     *
     * @param array<string, mixed> $params
     */
    public function hookDisplayBackOfficeHeader(array $params = [])
    {
        $configuredModule = (string) Tools::getValue('configure');
        $moduleName = (string) Tools::getValue('module_name');

        if ($configuredModule !== $this->name && $moduleName !== $this->name) {
            return;
        }

        $this->registerBackOfficeAssets();
    }

    private function registerBackOfficeAssets()
    {
        if ($this->assetsRegistered) {
            return;
        }

        $this->assetsRegistered = true;
        $this->context->controller->addJS($this->_path . 'views/js/productbuyers.js');
        $this->context->controller->addCSS($this->_path . 'views/css/productbuyers.css');

        Media::addJsDef([
            'productBuyersConfig' => [
                'ajaxUrl' => $this->context->link->getAdminLink(
                    'AdminModules',
                    true,
                    [],
                    [
                        'configure' => $this->name,
                        'ajax' => 1,
                    ]
                ),
                'translations' => [
                    'searching' => $this->trans('Searching…', [], 'Modules.Productbuyers.Admin'),
                    'loadingBuyers' => $this->trans('Loading buyers…', [], 'Modules.Productbuyers.Admin'),
                    'requestError' => $this->trans(
                        'The request could not be completed. Please try again.',
                        [],
                        'Modules.Productbuyers.Admin'
                    ),
                    'sessionExpired' => $this->trans(
                        'Your session has expired. Reload the page and try again.',
                        [],
                        'Modules.Productbuyers.Admin'
                    ),
                    'accessDenied' => $this->trans(
                        'You do not have permission to view this information.',
                        [],
                        'Modules.Productbuyers.Admin'
                    ),
                    'emptyQuery' => $this->trans(
                        'Enter a product name or reference.',
                        [],
                        'Modules.Productbuyers.Admin'
                    ),
                    'noProducts' => $this->trans('No products found.', [], 'Modules.Productbuyers.Admin'),
                    'noBuyers' => $this->trans(
                        'No validated order contains this product.',
                        [],
                        'Modules.Productbuyers.Admin'
                    ),
                    'productName' => $this->trans('Product name', [], 'Modules.Productbuyers.Admin'),
                    'reference' => $this->trans('Reference', [], 'Modules.Productbuyers.Admin'),
                    'purchaseCount' => $this->trans(
                        'Validated orders',
                        [],
                        'Modules.Productbuyers.Admin'
                    ),
                    'select' => $this->trans('View buyers', [], 'Modules.Productbuyers.Admin'),
                    'firstName' => $this->trans('First name', [], 'Modules.Productbuyers.Admin'),
                    'lastName' => $this->trans('Last name', [], 'Modules.Productbuyers.Admin'),
                    'orderReference' => $this->trans('Order', [], 'Modules.Productbuyers.Admin'),
                    'orderDate' => $this->trans('Order date', [], 'Modules.Productbuyers.Admin'),
                    'viewOrder' => $this->trans('View order', [], 'Modules.Productbuyers.Admin'),
                    'searchLimit' => $this->trans(
                        'Only the first 50 matching products are shown. Refine your search if needed.',
                        [],
                        'Modules.Productbuyers.Admin'
                    ),
                    'buyerLimit' => $this->trans(
                        'Only the 500 most recent orders are shown.',
                        [],
                        'Modules.Productbuyers.Admin'
                    ),
                    'backToProducts' => $this->trans(
                        'Back to product results',
                        [],
                        'Modules.Productbuyers.Admin'
                    ),
                    'retry' => $this->trans('Try again', [], 'Modules.Productbuyers.Admin'),
                    'buyersCaption' => $this->trans(
                        'Customers and validated orders containing this product',
                        [],
                        'Modules.Productbuyers.Admin'
                    ),
                    'productsCaption' => $this->trans(
                        'Products matching your search',
                        [],
                        'Modules.Productbuyers.Admin'
                    ),
                ],
            ],
        ]);
    }

    public function getContent()
    {
        if ((bool) Tools::getValue('ajax')) {
            $action = (string) Tools::getValue('action');

            if ($action === 'ProductSearch') {
                $this->ajaxProcessProductSearch();
            }

            if ($action === 'ProductBuyers') {
                $this->ajaxProcessProductBuyers();
            }

            $this->sendJsonResponse(
                [
                    'success' => false,
                    'error' => $this->trans('Unknown action.', [], 'Modules.Productbuyers.Admin'),
                ],
                400
            );
        }

        $this->registerBackOfficeAssets();

        $this->context->smarty->assign([
            'productbuyers_results_label' => $this->trans(
                'Product search results',
                [],
                'Modules.Productbuyers.Admin'
            ),
        ]);

        return $this->renderForm()
            . $this->display(__FILE__, 'views/templates/admin/configure.tpl');
    }

    private function renderForm()
    {
        $defaultLanguageId = (int) Configuration::get('PS_LANG_DEFAULT');

        $fieldsForm = [
            'form' => [
                'legend' => [
                    'title' => $this->trans(
                        'Search for a product',
                        [],
                        'Modules.Productbuyers.Admin'
                    ),
                    'icon' => 'icon-search',
                ],
                'description' => $this->trans(
                    'Buyers are taken from validated orders in the current shop.',
                    [],
                    'Modules.Productbuyers.Admin'
                ),
                'input' => [
                    [
                        'type' => 'text',
                        'label' => $this->trans(
                            'Product name or reference',
                            [],
                            'Modules.Productbuyers.Admin'
                        ),
                        'name' => 'PRODUCT_NAME',
                        'required' => true,
                        'id' => 'product_name',
                        'class' => 'fixed-width-xxl',
                        'maxlength' => 100,
                        'hint' => $this->trans(
                            'Search by product name or reference. You can enter up to 100 characters.',
                            [],
                            'Modules.Productbuyers.Admin'
                        ),
                    ],
                ],
                'buttons' => [
                    [
                        'type' => 'button',
                        'title' => $this->trans('Search', [], 'Modules.Productbuyers.Admin'),
                        'icon' => 'process-icon-search',
                        'class' => 'btn btn-primary pull-right',
                        'id' => 'search_product_button',
                    ],
                ],
            ],
        ];

        $helper = new HelperForm();
        $helper->show_toolbar = false;
        $helper->table = $this->name;
        $helper->module = $this;
        $helper->default_form_language = $defaultLanguageId;
        $helper->allow_employee_form_lang = $defaultLanguageId;
        $helper->identifier = 'id_product';
        $helper->submit_action = 'submit_productbuyers';
        $helper->currentIndex = $this->context->link->getAdminLink(
            'AdminModules',
            false,
            [],
            [
                'configure' => $this->name,
                'tab_module' => $this->tab,
                'module_name' => $this->name,
            ]
        );
        $helper->token = Tools::getAdminTokenLite('AdminModules');
        $helper->fields_value = [
            'PRODUCT_NAME' => '',
        ];

        return $helper->generateForm([$fieldsForm]);
    }

    public function ajaxProcessProductSearch()
    {
        $query = Tools::getValue('query');

        if (!is_string($query) || trim($query) === '') {
            $this->sendJsonResponse(
                [
                    'success' => false,
                    'error' => $this->trans(
                        'Enter a product name or reference.',
                        [],
                        'Modules.Productbuyers.Admin'
                    ),
                ],
                400
            );
        }

        $query = trim($query);
        $query = Tools::substr($query, 0, 100);
        $escapedQuery = pSQL(str_replace(
            ['\\', '%', '_'],
            ['\\\\', '\\%', '\\_'],
            $query
        ));
        $shopId = (int) $this->context->shop->id;
        $languageId = (int) $this->context->language->id;
        $resultLimit = self::MAX_SEARCH_RESULTS + 1;

        $sql = '
            SELECT
                p.id_product,
                pl.name,
                p.reference,
                COUNT(DISTINCT o.id_order) AS purchase_count
            FROM `' . _DB_PREFIX_ . 'product` p
            INNER JOIN `' . _DB_PREFIX_ . 'product_shop` ps
                ON ps.id_product = p.id_product
                AND ps.id_shop = ' . $shopId . '
            INNER JOIN `' . _DB_PREFIX_ . 'product_lang` pl
                ON pl.id_product = p.id_product
                AND pl.id_shop = ' . $shopId . '
                AND pl.id_lang = ' . $languageId . '
            LEFT JOIN `' . _DB_PREFIX_ . 'order_detail` od
                ON od.product_id = p.id_product
            LEFT JOIN `' . _DB_PREFIX_ . 'orders` o
                ON o.id_order = od.id_order
                AND o.id_shop = ' . $shopId . '
                AND o.valid = 1
            WHERE (pl.name LIKE \'%' . $escapedQuery . '%\'
                OR p.reference LIKE \'%' . $escapedQuery . '%\')
            GROUP BY p.id_product, pl.name, p.reference
            ORDER BY pl.name ASC
            LIMIT ' . $resultLimit;

        $results = Db::getInstance()->executeS($sql);

        if ($results === false) {
            $this->sendJsonResponse(
                [
                    'success' => false,
                    'error' => $this->trans(
                        'The product search failed.',
                        [],
                        'Modules.Productbuyers.Admin'
                    ),
                ],
                500
            );
        }

        $truncated = count($results) > self::MAX_SEARCH_RESULTS;
        $results = array_slice($results, 0, self::MAX_SEARCH_RESULTS);

        foreach ($results as &$result) {
            $result['id_product'] = (int) $result['id_product'];
            $result['name'] = (string) $result['name'];
            $result['reference'] = (string) $result['reference'];
            $result['purchase_count'] = (int) $result['purchase_count'];
        }
        unset($result);

        $this->sendJsonResponse([
            'success' => true,
            'data' => $results,
            'meta' => [
                'truncated' => $truncated,
            ],
        ]);
    }

    public function ajaxProcessProductBuyers()
    {
        $rawProductId = Tools::getValue('id_product');
        $productId = filter_var(
            is_string($rawProductId) || is_int($rawProductId) ? $rawProductId : false,
            FILTER_VALIDATE_INT,
            ['options' => ['min_range' => 1]]
        );

        if ($productId === false) {
            $this->sendJsonResponse(
                [
                    'success' => false,
                    'error' => $this->trans('Invalid product ID.', [], 'Modules.Productbuyers.Admin'),
                ],
                400
            );
        }

        $shopId = (int) $this->context->shop->id;
        $productBelongsToShop = (bool) Db::getInstance()->getValue(
            'SELECT 1
            FROM `' . _DB_PREFIX_ . 'product_shop`
            WHERE id_product = ' . $productId . '
                AND id_shop = ' . $shopId
        );

        if (!$productBelongsToShop) {
            $this->sendJsonResponse(
                [
                    'success' => false,
                    'error' => $this->trans(
                        'This product is not available in the current shop.',
                        [],
                        'Modules.Productbuyers.Admin'
                    ),
                ],
                404
            );
        }

        $resultLimit = self::MAX_BUYER_RESULTS + 1;

        $sql = '
            SELECT DISTINCT
                c.firstname,
                c.lastname,
                o.id_order,
                o.reference AS order_reference,
                o.date_add
            FROM `' . _DB_PREFIX_ . 'order_detail` od
            INNER JOIN `' . _DB_PREFIX_ . 'product_shop` ps
                ON ps.id_product = od.product_id
                AND ps.id_shop = ' . $shopId . '
            INNER JOIN `' . _DB_PREFIX_ . 'orders` o
                ON o.id_order = od.id_order
                AND o.id_shop = ' . $shopId . '
                AND o.valid = 1
            INNER JOIN `' . _DB_PREFIX_ . 'customer` c
                ON c.id_customer = o.id_customer
            WHERE od.product_id = ' . $productId . '
            ORDER BY o.date_add DESC
            LIMIT ' . $resultLimit;

        $results = Db::getInstance()->executeS($sql);

        if ($results === false) {
            $this->sendJsonResponse(
                [
                    'success' => false,
                    'error' => $this->trans(
                        'The buyer search failed.',
                        [],
                        'Modules.Productbuyers.Admin'
                    ),
                ],
                500
            );
        }

        $truncated = count($results) > self::MAX_BUYER_RESULTS;
        $results = array_slice($results, 0, self::MAX_BUYER_RESULTS);

        foreach ($results as &$result) {
            $result['id_order'] = (int) $result['id_order'];
            $result['firstname'] = (string) $result['firstname'];
            $result['lastname'] = (string) $result['lastname'];
            $result['order_reference'] = (string) $result['order_reference'];
            $result['date_add'] = Tools::displayDate($result['date_add'], true);
            $result['order_url'] = $this->context->link->getAdminLink(
                'AdminOrders',
                true,
                [],
                [
                    'id_order' => $result['id_order'],
                    'vieworder' => 1,
                ]
            );
        }
        unset($result);

        $this->sendJsonResponse([
            'success' => true,
            'data' => $results,
            'meta' => [
                'truncated' => $truncated,
            ],
        ]);
    }

    /**
     * @param array<string, mixed> $payload
     */
    private function sendJsonResponse(array $payload, $statusCode = 200)
    {
        if (!headers_sent()) {
            http_response_code((int) $statusCode);
            header('Content-Type: application/json; charset=utf-8');
            header('Cache-Control: no-store');
        }

        $json = json_encode(
            $payload,
            JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE
        );

        if ($json === false) {
            http_response_code(500);
            $json = '{"success":false,"error":"JSON encoding failed."}';
        }

        exit($json);
    }
}
