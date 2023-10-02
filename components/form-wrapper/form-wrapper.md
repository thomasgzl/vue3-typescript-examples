# FormWrapper

Ce composant définit un formulaire générique:
 - sauvegarde des données sur une api
 - affichage du formulaire
 - gestion des erreurs
 - ajout de boutons customs

En props il y a :
- `id` est l'identifiant du form, utilisé lors de l'event `FORM_WRAPPER_EVENTS.SUBMIT`.
- `vuelidate` la référence du v$ de Vuelidate.
- `invalid` si il faut flagguer en rouge dès le début les champs en erreurs.
- `apiSave` est l'url du POST lors du submit.
- `postData` est la fonction qui est appellée avant le submit. Elle a pour role de retourner les datas du POST à envoyer.
- `onUploadProgress` permet de spécifier une fonction appelée lors de l'envoi de donnée (Prend un paramètre un `progressEvent`).
- `httpMethod` par défaut POST, mais peut etre un GET, DELETE, ...
- `locked` permet de verrouiller tout le formulaire via un `<fieldset>`
 
Les données à sauvegarder doivent être placées dans la props `postData`. Lors de la sauvegarde, ce composant émet un évènement `submitted` indiquant que les données ont bien été sauvegardées dans l'api. Cet évènement contient les données sauvegardées.

Au submit, FormWrapper $emit en local et sur l'EventBus des 'loading', 'success' ou 'error'.
Il possible de déclencher un submit via l'EventBus avec l'event `FORM_WRAPPER_EVENTS.SUBMIT`.