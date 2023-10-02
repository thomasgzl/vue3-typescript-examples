# InputChooser

Ce composant permet d'afficher un ou plusieurs radio ou checkbox, son label et varier sa disposition.

En props il y a :
- `type` qui peut etre `radio` ou `checkbox`
- `axis` pour gérer l'affichage en horizontal ou vertical, `x` ou `y`
- `data`, qui est un tableau d'objets au format :
```js
[{ id: '001', value: this.$t(`yes`) }]
```
NOTE: un paramètre optionnel `class: string` permet l'ajout de classes sur le label.
- `id` pour faire l'association avec le `for` html
- `value` pour le v-model
- `disabled` désactive ou non la modification de l'input (par défaut à `false` = modifiable),
- `required` pour l'astérisque