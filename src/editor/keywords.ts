import { CompletionContext, CompletionResult } from "@codemirror/autocomplete"

interface Keyword {
  label: string
  type: string
  info?: string
  detail?: string
  apply?: string | ((context: CompletionContext) => string)
}


export const customKeywords: Keyword[] = [
    {
      label: "verticefdss",
      type: "property",
      info: "(Graph)",
      detail: "Collection de sommets du graphe",
      apply: "vertices"
    },
    {
      label: "size",
      type: "property",
      info: "(Number)",
      detail: "Nombre d'éléments dans la collection",
      apply: "size"
    },
    {
      label: "forEach",
      type: "method",
      info: "(void)",
      detail: "Exécute une fonction pour chaque élément",
      apply: "forEach"
    }
  ]



    // Création d'une source d'autocomplétion personnalisée
export function createCompletionSource(keywords: Keyword[]): (context: CompletionContext) => (CompletionResult | null) {
  return (context: CompletionContext) => {
    const word = context.matchBefore(/\w*/)
    if (!word) return null;
    if (word.from === word.to && !context.explicit) return null

    return {
      from: word.from,
      options: keywords,
      validFor: /^\w*$/
    } as CompletionResult
  }
}
    
    // Exemple d'utilisation avec vos mots-clés
    