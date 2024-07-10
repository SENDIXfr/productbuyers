<?php
/**
 * NOTICE OF LICENSE
 *
 * This file is licenced under the Software License Agreement.
 * With the purchase or the installation of the software in your application
 * you accept the licence agreement.
 *
 * You must not modify, adapt or create derivative works of this source code
 *
 *  @author    SENDIX
 *  @copyright 2014-2024 SENDIX
 *  @license   GNU General Public License version 2
 **/
if (!defined("_PS_VERSION_")) {
    exit();
} ?>
<?php class ProductBuyersAjaxProductSearchModuleFrontController extends
    ModuleFrontController
{
    public function initContent()
    {
        parent::initContent();
        $query = Tools::getValue("query");
        if (empty($query)) {
            die(json_encode(["error" => "No query provided"]));
        }
        $sql = new DbQuery();
        $sql->select("p.id_product, pl.name");
        $sql->from("product", "p");
        $sql->innerJoin(
            "product_lang",
            "pl",
            "p.id_product = pl.id_product AND pl.id_lang = " .
                (int) $this->context->language->id
        );
        $sql->where('pl.name LIKE \'%' . pSQL($query) . '%\'');
        $products = Db::getInstance()->executeS($sql);
        if (!$products) {
            die(json_encode(["error" => "No products found"]));
        }
        die(json_encode($products));
    }
}
