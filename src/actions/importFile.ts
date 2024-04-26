import { Socket } from "socket.io-client";
import { ClientBoard, SocketMsgType } from "../board/board";
import { CanvasCoord } from "../board/display/canvas_coord";
import { createPopup } from "../popup";

export function parseDot(board: ClientBoard, socket: Socket) {
    const [popUpDiv, content] = createPopup("parseDot", "Parse .dot file and import");
    popUpDiv.style.display = "block";

    const fileInput: HTMLTextAreaElement = document.createElement("textarea");

    const button = document.createElement("button");
    button.textContent = "Parse and import"
    content.appendChild(button);
    button.onclick = () => {
        const center = board.camera.create_server_coord(new CanvasCoord(400,400));
        socket.emit(SocketMsgType.PARSE_DOT, fileInput.value, center.x, center.y, board.camera.zoom*100);
        popUpDiv.remove();
    }

    content.appendChild(fileInput);
}
