# Product Buyers

Module d’administration PrestaShop permettant de rechercher un produit par nom
ou référence, puis d’afficher les clients associés à ses commandes validées.

## Compatibilité

- PrestaShop 8.0 à 9.1.x
- PHP : versions prises en charge par la version de PrestaShop installée
- Module testé syntaxiquement avec PHP 8.5, version recommandée pour PrestaShop 9.1

## Installation

1. Copier le dossier `productbuyers` dans le répertoire `modules` de la boutique,
   ou importer son archive ZIP depuis le gestionnaire de modules.
2. Installer ou mettre à niveau le module.
3. Ouvrir sa page de configuration.

Pour une mise à niveau en ligne de commande depuis la racine de PrestaShop :

```bash
php bin/console prestashop:module upgrade productbuyers
```

## Utilisation

1. Saisir tout ou partie du nom ou de la référence d’un produit.
2. Cliquer sur **Rechercher**.
3. Cliquer sur **Voir les acheteurs** pour consulter les commandes validées.

La recherche est limitée aux 50 premiers produits correspondants. La liste des
acheteurs affiche au maximum les 500 commandes validées les plus récentes. Les
données et commandes sont limitées à la boutique active en contexte multiboutique.

## Sécurité et données

- Les appels AJAX utilisent l’URL d’administration sécurisée générée par PrestaShop.
- Les liens de commande sont générés côté serveur par `Link::getAdminLink()`.
- Les valeurs produit et client sont insérées dans le DOM comme texte, jamais comme HTML.
- Le module ne crée aucune table et ne conserve aucune donnée client supplémentaire.

## Version 1.0.0

- compatibilité déclarée avec PrestaShop 9.1 ;
- correction du chargement global et de la variable de commande non définie ;
- prise en charge du multiboutique et des seules commandes validées ;
- prévention des doublons et limitation des résultats ;
- sécurisation du rendu JavaScript contre les injections HTML ;
- traductions et ergonomie du back-office modernisées.
