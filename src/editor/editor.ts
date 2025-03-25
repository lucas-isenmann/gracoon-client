import {basicSetup} from "codemirror"
import {javascript} from "@codemirror/lang-javascript"
// npm i @codemirror/theme-one-dark
import {Decoration, EditorView} from "@codemirror/view"
import {autocompletion} from "@codemirror/autocomplete"
import { EmbeddedGraph, generateCliqueCircle } from "gramoloss";
import { codeExample } from "./code_example";
import { createCompletionSource, customKeywords } from "./keywords";
import { ClientBoard } from "../board/board";
import { oneDark, oneDarkTheme } from "@codemirror/theme-one-dark";



// Create an iframe for sandboxing the code (executing the code in an HTMLElement)
const globalIframe = document.createElement('iframe');
globalIframe.setAttribute('sandbox', 'allow-scripts');
globalIframe.style.display = 'none';
document.body.appendChild(globalIframe);

  

export function createEditor(container: HTMLElement, board: ClientBoard){
    
    // Create code editor
    const editorView = new EditorView({
        doc: codeExample,
        parent: container,
        extensions: [
          basicSetup,
          oneDarkTheme,
          javascript(),
          EditorView.theme({
            //   "&": { background: "#bbbbbb" },
            //   ".cm-scroller": { background: "#282c34" }
            }, {dark: false}),
            autocompletion({
                override: [createCompletionSource(customKeywords)]
              })
      , ]
      })

    // Create output div
    const outputDiv = document.createElement("div")
    outputDiv.classList.add("output")
    container.appendChild(outputDiv)


    // Create execution button
    const button = document.createElement("button")
    button.onclick = () => {
    let code = editorView.state.doc.toString()
        // code = `console.log(3); return 4`;
        executeCode(code).then(result => {
            displayOutput(result);
        })
        .catch(error => {
            console.error('Erreur:', error);
        });
        }
    container.appendChild(button);


    


    // Function to display output/errors
    function displayOutput(text: string, isError = false) {
        const message = document.createElement("div")
        message.classList.add("message");
        if (isError){
            message.classList.add("error")
        }
        message.textContent = text
        outputDiv.appendChild(message)
        outputDiv.scrollTop = outputDiv.scrollHeight
    }

    async function executeCode(code: string): Promise<any> {

        const g = board.g;

        try {
            const iframeWindow = globalIframe.contentWindow;
            if (!iframeWindow) {
                throw new Error('Could not access iframe window');
            }
            const func = new Function('g', code);
            return func(g);
        } catch (error) {
            if (error instanceof Error){
                console.log(error.stack)
            }
            displayOutput(`Error: ${error instanceof Error ? error.message : String(error)}`, true);
            
            
            throw error;
        }
    }
}

  















 


