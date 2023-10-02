# Paginator

Ce composant permet de charger du contenu paginé de l'api Opale.
Le paginator ne met pas à jour lui même les données `page` et `items`.
Il émet un événement ave le changement, que le parent est libre de modifier, qui est ensuite redonné au Paginator.

Il prend en props :
- `id` string qui sert d'identifiant pour écouter les events
- `httpMethod` post ou get
- `contentType` 'application/json' (défaut) ou autre
- `page` page courante utilisée pour la pagination
- `pageSize` nombre d'élément par page
- `additionalParams` objet contenant les infos à donner à l'api en plus de ceux de la pagination
- `keyLoop` string pour le key v-for (défaut 'id')
- `url` endpoint de l'api à appeler
- `items` array contenant les éléments
- `container` HTMLElement du parent ayant le scroll

Il émet en local ces événements :
- `update:page` lorsque la page courante change 
- `update:items` lorsque le contenu reçu de l'api change
- `update:totalItems` à la réception de l'api, nombre total d'items
- `loading` au début/fin d'appel api
- `error` si erreur api
- `raw-http-response` contenu complet de la derniere requete http

Le default slot est celui utilisé pour le v-for. Il peut être vide dans le cas d'une utilisation purement headless.
Un autre slot "loading" est disponible pour le chargement.