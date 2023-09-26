# TODO

## BIG Features

- loop
- personnal code

## Features

- [grid-polar] change the center
- [grid-polar] change the angle division
- [grid-polar] align on the circles
- sanitize content-editable
- invert arc on right click
- move vertex on link -> subdivide
- deleteInteractor: has a radius, change it with wheel

## Refacto

- view should be renamed in camera, alignements variables out of it
- aggregate Modifications when the mousmove is not over
- après caméra change: update tous les canvas: tous les éléments doivent avoir une fonction
- mousePos dans les interactors: plus nécessaires car dans board.selfUser.canvasPos
- mieux gérer les sorties du canvas/ecran
- dans Selection : Resizable: translate_by_canvas_vect. En fait le translate doit avoir un spécifique (genre les area quand on les translate déplacent les sommets dedans, les repre aussi) et le translate générique translate les c1 c2 ...
- interactor manager : event on window, not on canvas

## To Think

- style of selection?

## Unifier

- tout élement de board doit avoir index, clearDOM
- BIG Refacto: no more graphs in Board, just elements (which are updated after camera move/zoom, translated, resized). The associated graph is computed at each modification or at each computation.

## Issues

- when we create links with Control, stop appuyer on Control, the link does not disappear, and if you use another interactor and you got back to link interactor, then the last vertex is still used ...
- representations
- bug when undo delete the weights of the links

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

- SideBars and PreInteractor
  - [ ] fix cursors ( color_interactorV2 and pen)

- [ ] code break dans les compute function (voir la note dans le fichier parametor.ts)
- [ ] copier/coller le sous-graphe induit par la sélection de sommets
- [ ] turoriel
- [ ] multi-arêtes
- [ ] multi control point
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
