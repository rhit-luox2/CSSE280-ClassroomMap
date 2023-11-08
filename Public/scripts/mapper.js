const walls = [];
let tempWallStart = null;

document.getElementById('loadButton').addEventListener('click', loadSVG);
document.getElementById('exportButton').addEventListener('click', exportData);

function loadSVG() {
    const selectedFloor = document.getElementById('floorSelect').value;
    const svgObject = document.getElementById('FloorMap');
    svgObject.data = selectedFloor; 
    svgObject.addEventListener('load', function() {
        const svgDoc = svgObject.contentDocument;
        svgDoc.addEventListener('click', (event) => {
            if (!tempWallStart) {
                tempWallStart = {
                    x: event.clientX,
                    y: event.clientY
                };
                alert('Start point of the wall set. Click the end point of the wall.');
            } else {
                const wallEnd = {
                    x: event.clientX,
                    y: event.clientY
                };
                walls.push({ start: tempWallStart, end: wallEnd });
                tempWallStart = null; // Reset for the next wall
                console.log('Stored wall:', walls[walls.length - 1]);
            }
        });
    });
}

function exportData() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ walls }));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "walls.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}


