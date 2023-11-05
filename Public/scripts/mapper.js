const classrooms = {};

document.getElementById('loadButton').addEventListener('click', loadSVG);
document.getElementById('exportButton').addEventListener('click', exportData);

function loadSVG() {
    const selectedFloor = document.getElementById('floorSelect').value;
    const svgObject = document.getElementById('FloorMap');
    
    svgObject.data = selectedFloor; // Set the SVG data source
    
    // Add an event listener for the load event
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

