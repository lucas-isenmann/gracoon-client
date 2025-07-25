import { Socket } from "socket.io-client";
import { ClientBoard, SocketMsgType } from "../board/board";
import { CanvasCoord } from "../board/display/canvas_coord";
import { createPopup } from "../popup";

export function parseDot(board: ClientBoard, socket: Socket) {
    const [popUpDiv, content] = createPopup("parseDot", "Parse dot file and import");
    popUpDiv.style.display = "block";


    const fileInput: HTMLTextAreaElement = document.createElement("textarea");
    fileInput.id = "dot-parse-import-input";
    fileInput.placeholder = 
`Paste dot file here. 
The graph will be pasted in the middle of the board screen.

digraph G {
    0 -> 3 [label=11];
    0 -> 4 [label=9];
    0 -> 5 [label=12];
    0 -> 6 [label=7];
}
`

    const button = document.createElement("button");
    button.id = "dot-parse-import-button"
    button.textContent = "Parse and import"
    button.onclick = () => {
        const center = board.camera.createServerCoord(new CanvasCoord(400,400, board.camera));
        socket.emit(SocketMsgType.PARSE_DOT, fileInput.value, center.x, center.y, board.camera.zoom*100);
        popUpDiv.remove();
    }

    content.appendChild(fileInput);
    content.appendChild(button);

}
