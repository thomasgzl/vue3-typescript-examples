# BtnMultiStates

Affiche un bouton ayant 4 états possibles : `idle`,`loading`,`error`,`success`.
Selon son état, le contenu du bouton va changer. Par défaut, le bouton affiche un contenu prédéfini mais il est possible d'écraser un ou des contenus via les [`slot`](https://fr.vuejs.org/v2/guide/components-slots.html) Vuejs.

En attribut ce composant attend :
- `state` l'état courant du bouton
- `type` si le bouton doit être de type 'submit' ou 'button'
- `cssClass` pour lui affecter/changer ses classes CSS
- `fixedWidth` boolean, par défaut à `true`, fixe la taille du bouton à une width précise