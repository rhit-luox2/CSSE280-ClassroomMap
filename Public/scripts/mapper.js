const classrooms = {};

window.onload = function() {
    const svgObject = document.getElementById('FloorMap');
    svgObject.addEventListener('load', function() {
        const svgDoc = svgObject.contentDocument;
        svgDoc.addEventListener('click', (event) => {
            const className = prompt("Enter the classroom name/number:");
            if (className) {
                classrooms[className] = {
                    x: event.clientX,
                    y: event.clientY
                };
                console.log('Stored:', className, 'at', classrooms[className]);
            }
        });
    });
};

function loadSVG() {
    const selectedFloor = document.getElementById('floorSelect').value;
    document.getElementById('FloorMap').setAttribute('data', 'FloorMap/' + selectedFloor);
}

function exportData() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(classrooms));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "classrooms.json");
    document.body.appendChild(downloadAnchorNode); // Required for Firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}
