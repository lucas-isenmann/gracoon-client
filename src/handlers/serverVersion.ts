
/**
 * Message from server: server-version.
 */
export function handleServerVersion(version: string){
    const div = document.getElementById("server-version");
    if (div){
        div.innerHTML =  version;
    }
}