import closeIcon from './img/parametor/plus.svg';



export function createPopup(id: string, title: string): [HTMLDivElement, HTMLDivElement]{
    const div = document.createElement("div");
    div.classList.add("popup");
    div.id = id;
    document.body.appendChild(div);

    // Event: Close popup with Escape key
    window.addEventListener("keydown", (e) => {
        if (e.key == "Escape"){
            div.style.display = "none";
        }
    });

    // Title 
    const titleDiv = document.createElement("div");
    titleDiv.classList.add("popup_title");
    titleDiv.innerHTML = title;
    div.appendChild(titleDiv);

    // Close button 
    const closeButton = document.createElement("img");
    closeButton.classList.add("close_button");
    closeButton.src = closeIcon;
    closeButton.onclick = () => {
        div.style.display = "none";
    }
    div.appendChild(closeButton);

    // Content
    const content = document.createElement("div");
    content.classList.add("popup_content");
    content.id = id + "_content";
    div.appendChild(content);
    
    return [div, content];
}