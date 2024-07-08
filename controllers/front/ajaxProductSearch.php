<?php
class ProductBuyersAjaxProductSearchModuleFrontController extends ModuleFrontController
{
    public function initContent()
    {
        parent::initContent();
        
        $query = Tools::getValue('query');
        
        if (empty($query)) {
            die(json_encode(array('error' => 'No query provided')));
        }

        $sql = new DbQuery();
        $sql->select('p.id_product, pl.name');
        $sql->from('product', 'p');
        $sql->innerJoin('product_lang', 'pl', 'p.id_product = pl.id_product AND pl.id_lang = ' . (int)$this->context->language->id);
        $sql->where('pl.name LIKE \'%' . pSQL($query) . '%\'');
        
        $products = Db::getInstance()->executeS($sql);

        if (!$products) {
            die(json_encode(array('error' => 'No products found')));
        }

        die(json_encode($products));
    }
}
