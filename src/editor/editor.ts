import {basicSetup} from "codemirror"
import {javascript} from "@codemirror/lang-javascript"
import {Decoration, EditorView} from "@codemirror/view"
import {autocompletion} from "@codemirror/autocomplete"
import { codeExample } from "./code_example";
import { createCompletionSource, customKeywords } from "./keywords";
import { BoardElementType, ClientBoard } from "../board/board";
import { oneDark } from "@codemirror/theme-one-dark";
import { Graph2 } from "../board/graph2";

const originalConsole = {
    log: console.log.bind(console),
};

// Create an iframe for sandboxing the code (executing the code in an HTMLElement)
const globalIframe = document.createElement('iframe');
globalIframe.setAttribute('sandbox', 'allow-scripts');
globalIframe.style.display = 'none';
document.body.appendChild(globalIframe);


enum ScriptType {
    Parameter,
    Mutator
}




enum MessageType {
    Log,
    Warning,
    Error,
    Result
}


// Script management class
class ScriptManager {
    private scripts: Map<string, EditorView> = new Map();
    private activeScript: string | null = null;
    private outputDiv: HTMLElement;
    
    constructor(private container: HTMLElement, private board: ClientBoard) {
        this.outputDiv = this.container.querySelector('.output')!;
        this.initialize();
    }
    
    private initialize() {
        const tabBar = this.container.querySelector('.tab-bar')!;
        const editorArea = this.container.querySelector('.editor-area')!;

        // Create play button
        const playButton = document.createElement('button');
        playButton.textContent = '▶';
        playButton.className = 'new-script-button';
        playButton.onclick = () => this.executeAs(ScriptType.Parameter);
        tabBar.appendChild(playButton);

        // Create play button
        const mutatorButton = document.createElement('button');
        mutatorButton.textContent = '⚒';
        mutatorButton.className = 'new-script-button';
        mutatorButton.onclick = () => this.executeAs(ScriptType.Mutator);
        tabBar.appendChild(mutatorButton);
        
        // Create new script button
        const newScriptButton = document.createElement('button');
        newScriptButton.textContent = '+';
        newScriptButton.className = 'new-script-button';
        newScriptButton.onclick = () => this.createScript(`Script ${this.scripts.size + 1}`);
        tabBar.appendChild(newScriptButton);

        this.createScript("script1")
        this.createScript("script2")
    }
    
    createScript(name: string) {
        if (this.scripts.has(name)) {
            console.error(`Script "${name}" already exists`);
            return;
        }
        
        // Create tab
        const tab = document.createElement('div');
        tab.className = 'tab';
        tab.textContent = name;
        tab.onclick = () => this.activateScript(name);
        this.container.querySelector('.tab-bar')!.appendChild(tab);
        // tab.contentEditable = "true";

        // Create Div
        const container = document.createElement("div");
        this.container.querySelector('.editor-area')!.appendChild(container);
        
        // Create editor
        const editor = new EditorView({
            doc: codeExample,
            parent: container,
            extensions: [
              basicSetup,
              oneDark,
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

          editor.dom.addEventListener('keydown', (event) => {
            // Run with Control + Enter
            if (event.ctrlKey && event.key === 'Enter') {
                event.preventDefault();
                event.stopPropagation();
                this.executeAs(ScriptType.Parameter);
            }
            else if (event.shiftKey && event.key === 'Enter') {
                event.preventDefault();
                event.stopPropagation();
                this.executeAs(ScriptType.Mutator);
            }
        });
        
        this.scripts.set(name, editor);
        this.activateScript(name);
    }
    
    private activateScript(name: string) {
        if (!this.scripts.has(name)) return;
        
        // Update tabs
        this.container.querySelectorAll('.tab').forEach(tab => {
            tab.classList.toggle('active', tab.textContent === name);
        });
        
        // Update editors
        this.scripts.forEach((editor, scriptName) => {
            const parent = editor.dom.parentElement;
            if (parent){
                parent.style.display = scriptName === name ? 'block' : 'none';
            }
        });
        
        this.activeScript = name;
    }

    async executeCode(code: string, g: Graph2): Promise<any> {
        // const g = board.g;
        try {
            const iframeWindow = globalIframe.contentWindow;
            if (!iframeWindow) {
                throw new Error('Could not access iframe window');
            }
            const func = new Function('g', code);
            
            return func(g);
        } catch (error) {
            
            this.displayOutput(`Error: ${error instanceof Error ? error.message : String(error)}`, MessageType.Error);
            throw error;
        }
    }

    executeAs(scriptType: ScriptType){
        if (this.activeScript == null){
            return;
        }

        const script = this.scripts.get(this.activeScript);

        if (typeof script == "undefined"){
            return;
        }

        // Get the current code
        const code = script.state.doc.toString();

        // Override console methods to capture output
        console.log = (...args: any[]) => {
            const message = args.map(arg => 
                typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
            ).join(' ');
            
            this.displayOutput(message, MessageType.Log);
            originalConsole.log(...args);
        };
            
        // Execute the code
        this.executeCode(code, this.board.g).then(result => {
            if (scriptType == ScriptType.Parameter){
                this.displayOutput(result, MessageType.Result);
            } else if (scriptType == ScriptType.Mutator){
                const gr = result;
                const elements = new Array();
                for (const v of this.board.g.vertices.values()){
                    elements.push( [BoardElementType.Vertex, v.index] )
                }
                this.board.emit_delete_elements(elements)
                this.board.emitPasteGraph(gr);
            }
            
            console.log = (...args: any[]) => {
                originalConsole.log(...args);
            }
        }).catch(error => {
            console.log = (...args: any[]) => {
                originalConsole.log(...args);
            }
            console.error('Error:', error);
            this.displayOutput(`Error: ${error instanceof Error ? error.message : String(error)}`, MessageType.Error);
        });
    }

  


    // Function to display output/errors
    displayOutput(text: string, type: MessageType) {
        const message = document.createElement("div")
        message.classList.add("message");
        if (type == MessageType.Error){
            message.classList.add("error")
        }
        if (type == MessageType.Warning){
            message.classList.add("warning")
        }
        if (type == MessageType.Result){
            message.classList.add("result")
        }
        message.textContent = text
        this.outputDiv.appendChild(message)
        this.outputDiv.scrollTop = this.outputDiv.scrollHeight
    }
}









  

export function createEditor(container: HTMLElement, board: ClientBoard){

    new ScriptManager(container, board);

    return;

    
    
    
    
    function play(){
        // Get the current code
        const code = editorView.state.doc.toString();

        // Override console methods to capture output
        console.log = (...args: any[]) => {
            const message = args.map(arg => 
                typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
            ).join(' ');
            
            displayOutput(message, MessageType.Log);
            originalConsole.log(...args);
        };
            
        // Execute the code
        executeCode(code).then(result => {
            displayOutput(result, MessageType.Result);
            console.log = (...args: any[]) => {
                originalConsole.log(...args);
            }
        }).catch(error => {
            console.log = (...args: any[]) => {
                originalConsole.log(...args);
            }
            console.error('Error:', error);
            displayOutput(`Error: ${error instanceof Error ? error.message : String(error)}`, MessageType.Error);
        });
    }


    function playMutator(){
        // Get the current code
        const code = editorView.state.doc.toString();
            
        // Execute the code
        executeCode(code).then(result => {
            const gr = result;
            
            const elements = new Array();
            for (const v of board.g.vertices.values()){
                elements.push( [BoardElementType.Vertex, v.index] )
            }
            board.emit_delete_elements(elements)
            board.emitPasteGraph(gr);
        }).catch(error => {
            console.error('Error:', error);
            displayOutput(`Error: ${error instanceof Error ? error.message : String(error)}`, MessageType.Error);
        });
    }

    
    // Create code editor
    const editorView = new EditorView({
        doc: codeExample,
        parent: container,
        extensions: [
          basicSetup,
          oneDark,
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

    
    editorView.dom.addEventListener('keydown', (event) => {
        // Run with Control + Enter
        if (event.ctrlKey && event.key === 'Enter') {
            event.preventDefault();
            event.stopPropagation();
            play();
        }
        else if (event.shiftKey && event.key === 'Enter') {
            event.preventDefault();
            event.stopPropagation();
            playMutator();
        }
    });

    // Create output div
    const outputDiv = document.createElement("div")
    outputDiv.classList.add("output")
    container.appendChild(outputDiv)


    // Create execution button
    const button = document.createElement("button")
    button.textContent = "▶"
    button.onclick = () => {
        play();
    }
    container.appendChild(button);


    


    // Function to display output/errors
    function displayOutput(text: string, type: MessageType) {
        const message = document.createElement("div")
        message.classList.add("message");
        if (type == MessageType.Error){
            message.classList.add("error")
        }
        if (type == MessageType.Warning){
            message.classList.add("warning")
        }
        if (type == MessageType.Result){
            message.classList.add("result")
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
            
            displayOutput(`Error: ${error instanceof Error ? error.message : String(error)}`, MessageType.Error);
            throw error;
        }

        
    }


    
}

  















 


