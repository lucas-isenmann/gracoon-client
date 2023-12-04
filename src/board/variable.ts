
export interface Var {
    getValue: () => number | boolean;
} 

export class VariableBoolean{
    id: string;
    value: boolean;
    div: HTMLDivElement;

    constructor(id: string, value: boolean, onchangeHandler: () => void){
        this.id = id;
        this.value = value;
        this.div = document.createElement("div");

        // label
        const label = document.createElement("label");
        label.innerText = id + ": ";
        label.classList.add("attribute_label");
        this.div.appendChild(label);

        // input div
        const input = document.createElement("input");
        // input.classList.add("");
        input.name = this.id;
        input.type = "checkbox";
        input.checked = this.value;

        input.oninput = (e) => {
            this.value = input.checked;
            onchangeHandler();
        }

        this.div.appendChild(input);
    }

    getValue(): boolean{
        return this.value;
    }
}

export class VariableNumber{
    id: string;
    value: number;
    div: HTMLDivElement;

    constructor(id: string, min: number, value: number,  max: number, step: number, onchangeHandler: () => void){
        this.id = id;
        this.value = value;

        this.div = document.createElement("div");

        // label
        const label = document.createElement("label");
        label.innerText = id + ": ";
        label.classList.add("attribute_label");
        this.div.appendChild(label);

        // input div
        const input = document.createElement("input");
        input.classList.add("attr_percentage");
        input.name = this.id;
        input.type = "range";
        input.min = String(min);
        input.max = String(max);
        input.step = String(step);
        input.value = String(this.value);

        input.oninput = (e) => {
            this.value = parseFloat(input.value);
            const currentValueSpan = document.getElementById(this.id+"_current_value");
            if(currentValueSpan){
                currentValueSpan.innerText = String(this.value);
            }
            onchangeHandler();

        }

        this.div.appendChild(input);
        
        // value span
        const currentValueSpan = document.createElement("span");
        currentValueSpan.id = id + "_current_value";
        currentValueSpan.classList.add("attribute_range_current_value");
        currentValueSpan.innerText = String(this.value);
        this.div.appendChild(currentValueSpan);

    }

    getValue(): number{
        return this.value;
    }
}