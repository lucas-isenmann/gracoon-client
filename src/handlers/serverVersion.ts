
/**
 * Message from server: server-version.
 */
export function handleServerVersion(version: string){
    const div = document.createElement("div");
    div.id = "serverVersion";
    div.innerHTML = "server-version: " + version;
    document.body.appendChild(div);
}