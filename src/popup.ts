import closeIcon from './img/parametor/plus.svg';



export function createPopup(id: string, title: string){
    const div = document.createElement("div");
    div.classList.add("popup");
    div.id = id;
    document.body.appendChild(div);

    // Close popup with Escape key
    window.addEventListener("keydown", (e) => {
        if (e.key == "Escape"){
            div.style.display = "none";
        }
    });

    // Title -----
    const title_div = document.createElement("div");
    title_div.classList.add("popup_title");
    title_div.textContent = title;
    div.appendChild(title_div);

    // Close button ------
    const close_button = document.createElement("img");
    close_button.classList.add("close_button");
    close_button.src = closeIcon;
    close_button.onclick = () => {
        div.style.display = "none";
    }
    div.appendChild(close_button);

    // Div content ---------
    const div_content = document.createElement("div");
    div_content.classList.add("popup_content");
    div_content.id = id + "_content";
    div.appendChild(div_content);
    
    return div;
}