# TODO

## Features

- [ ] invert arc on right click
- [ ] move vertex on link -> subdivide
- [ ] deleteInteractor: has a radius, change it with wheel
- [ ] ApplyModifyer on the selection

## Refacto

- [ ] interactor manager : event on window, not on canvas

## Issues

- [ ] representations
- [ ] bug when undo delete the weights of the links

------------------------------------------------------

## Old TODO List


- stroke
  - [ ] effacer mieux (plus tard)
  - [ ] création et translation en live (plus tard, interet ??)
  - [ ] améliorer pour plus de visibilité

- parametre
  - [ ] doc gestion latex
  - [ ] verbose
  - [ ] import à partir d'une fonction de gramoloss

- grid
  - [ ] vertical triangular grid 
  - [ ] polar grid
  - [ ] hexagonal grid ???


- [ ] gestion tablette
- [ ] optimisation possible en Math.floor() dans view.canvasCoord
- [ ] 
- quand on déplace un sommet sur un autre ça les fusionne
  - [X] ça marche
  - [ ] visuel qui dit que ça va fusionner quand on déplace
  - [ ] aligner le sommet déplacé sur le sommet cible ?
  - [ ] fusion des aretes : garder les couleurs et les cp ?
- [ ] trouver une autre visualisation des sommets et arêtes séléctionnés
- [ ] interactor move (qui fait que déplacer la vue ou les éléments)
- [ ] interactor select2: pas besoin de faire CTRL pour pas en avoir besoin pour la tablette ?
- interactor distance ?? on clique sur un sommet et ça affiche une règle de mesure pour mesurer la distance à un autre sommet survolé. On peut faire ça pour d'autres paramètres ultra classiques (degré ?)

- generators
  - [ ] prévisualisation du rendu ??
  - [ ] import à partir de Gramoloss
  - [ ] Paley

- text interactor
  - [ ] manually positioning labels

- TextZone
  - [ ] issue: two <Enter> gives 3 <br> ...
  - [ ] security:  exclude html tag (like <br>)
  - [ ] mutex: two clients should not edit textZone simultaneously
  - [ ] highlight
  - [ ] set carret to the position of the click (difficulty: hard)
  - [ ] improve tab insertion
  - [ ] too much Modification to cancel

- copier coller
  - [ ] est ce que ça serait pas plus logique un Control D ?
  - [ ] est ce que ça serait pas plus logique de juste faire Control et glisser ?
  - [ ] est ce que faut prendre les aretes induites meme si elles sont pas séléctionnées ?
  - [ ] est ce que faudrait pas un autre type de dupliquer qui conserve les links avec le reste ?


- [ ] load/export json

- control Z
  - [ ] load_json


- server API
  - [ ] fix sensibilities and Return of Modifications
  - [ ] classes for emit (so that it checks the type of the emitted elements)

- Representations
  - [ ] le recadagre d'une représentation devrait être la même que pour area et une forme rectangulaire
  - [ ] mise à jour de la repré
  - [ ] repré en fonction d'une area
  - [ ] delete repré
  - [ ] dw: afficher les stats du current: cutwidth, nb backarc
  - [ ] une autre repré : planaire y en a plein
  - [ ] param: dw, is_sparse, glouton, fas
  - [ ] collabiser les représ
  - [ ] annulable

- [ ] exporter Latex
- [ ] exporter pdf
- [ ] export graphviz ?
- [ ] interactor/parameter/modifyer: les mettre dans des fichiers séparés
- [ ] diapo graphe

- parametre
  - [ ] attributs
  - [ ] déplacer les calculs dans le serveur ??
  - [ ] fix update

- graph moving modifyer
  - modifie automatiquement le graphe en fonction du placement des sommets
  - exemples 
    - [ ] degreewidth
    - [ ] unit disk graph (v est relié w ssi la distance graphique <= 1 )

- [ ] loop

- SideBars and InteractorV2
  - [ ] rename InteractorV2 to Interactor
  - [ ] move right_side_bar to left
  - [ ] shortcut
  - [ ] select interactor in folder
  - [ ] fix color interactor
  - [ ] fix cursors ( color_interactorV2 and pen)
  - [ ] bottom_side_bar
  - [ ] change label action to graph modifyer



- [ ] code break dans les compute function (voir la note dans le fichier parametor.ts)
- [ ] copier/coller le sous-graphe induit par la sélection de sommets
- [ ] turoriel
- [ ] multi-arêtes
- [ ] multi control point
- [ ] insertion de parametres ou modifiyer perso
- [ ] chat vocal
- [ ] chat écrit


## Known issues 

- Chrome : no export to file? 
- Diameter : Only non oriented
- zoom and create links
    solution : changer les canvasCoord en serverCoord (genre link_creating_start) puis au zoom mettre à jour les serverCoord dans view
    OU
    interdire le zoom pendant la création ?
- start resizing area, then leave mouse out of window, stop clicking, then mouse back on window = bug -> pareil avec création de link, couleur, pen ... solution avec événement outofscreen si existe ?
- bug avec param Geometric et sommet qui rentre dans area
- vertex align crée des sommets sur d'autres sommets

