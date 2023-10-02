# GetterWrapper

Permet de charger du contenu d'api via la props `apiLoad` qui est un tableau d'objet `{url, options}`.
- `id` est l'identifiant de la route, utilisé pour un reload partiel
- `url` est un string, une url relative ou absolue
- `options`  est un objet d'options pour Axios
- `ignoreFail` permet d'ignorer le possible échec de la requete http

GetterWrapper doit recevoir en prop aussi un `id` qui est utilisé lors de l'event `GETTER_WRAPPER_EVENTS.LOAD`.

Retourne l'event `data` lorsque les données sont chargées. Dans le payload de l'event, il y a toutes les données.
En cas d'erreur, un event `error` est $emit.

Au `created()`, si il y a des routes dans `apiLoad`, GetterWrapper lancera automatiquement le chargement.
Il est possible de demander à charger les données d'un GetterWrapper manuellement via l'event `GETTER_WRAPPER_EVENTS.LOAD` via l'EventBus.
Lors de cette demande de chargement, on peut spécifier si on veut un chargement complet `GETTER_WRAPPER_LOAD_TYPES.FULL` ou partiel `GETTER_WRAPPER_LOAD_TYPES.PARTIAL`.

Le chargement FULL enlève tout le contenu du DOM via un `v-if`. L'avantage du chargement PARTIAL est de verrouiller les clicks via pointer-event, puis de dispatcher le nouveau data. Ainsi le contenu précédent n'est pas enlevé/déchargé pour etre rechargé. On gagne en perf DOM et en confort utilisateur (composant non réinit comme l'accordion).
