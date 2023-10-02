# InfiniteDropdown

Ce composant permet d'instancier une version de TomSelect chargeant une route paginée dans laquelle l'utilisateur peut rechercher et qui s'étend lors d'un scroll en bas de la liste de l'input.

Il prend en charge les propriétés suivantes :

- `id` : **String** L'identifiant unique de l'élément
- `modelValue` : **[Array, Object]** La valeur du v-model
- `multiple` : **Boolean** Spécifie si l'utilisateur peut sélectionner une ou plusieurs valeur (change le format de retour en tableau ou en objet)
- `route` : **String** La route de l'API appellé par le composant
- `params` : **Object** Les paramètres éventuels de la route
- `label` : **String** Le label sur lequel filtrer les éléments de la liste dans le TomSelect
- `parse` : **Function** Une fonction qui prend en paramètre un objet retourné par l'api et retourne un objet tel qu'utilisé dans le composant
- `lazy` : **Boolean** Définie si le composant doit appeler la route dès sa création ou lors du premier focus de l'élément