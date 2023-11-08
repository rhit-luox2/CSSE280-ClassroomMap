let mapData = {
    floor1: {
        classrooms: null,
        paths: null,
        stairs: null,
        walls: null
    },
    floor2: {
        classrooms: null,
        paths: null,
        stairs: null,
        walls: null
    }
};

let currentFloor = 1;

function loadJSONData() {
    let promises = [];

    ['floor1', 'floor2'].forEach(floor => {
        // Load classroom data
        promises.push($.getJSON(`/assets/${floor}_classrooms.json`).then(data => {
            mapData[floor].classrooms = data;
        }));

        // Load path data
        promises.push($.getJSON(`/assets/${floor}_path.json`).then(data => {
            mapData[floor].paths = data;
        }));

        // Load stairs data
        promises.push($.getJSON(`/assets/${floor}_stairs.json`).then(data => {
            mapData[floor].stairs = data;
        }));

        // Load walls data
        promises.push($.getJSON(`/assets/${floor}_walls.json`).then(data => {
            mapData[floor].walls = data.walls; // Make sure your JSON structure has a "walls" key
        }));
    });

    return Promise.all(promises);
}


function loadSVG(floorNumber) {
    currentFloor = floorNumber;
    $("#svgContainer").load(`/AllFloorMap/floor_${floorNumber}.svg`, function(response, status, xhr) {
        if (status === "error") {
            console.error("Failed to load the SVG: ", xhr.status, xhr.statusText);
        } else {
            // SVG loaded successfully
        }
    });
}

const jsonReference = { x: 1122, y: 389 };
const svgReference = { x: 2042, y: 712 };

const scaleX = svgReference.x / jsonReference.x;
const scaleY = svgReference.y / jsonReference.y;
const translateX = svgReference.x - (jsonReference.x * scaleX);
const translateY = svgReference.y - (jsonReference.y * scaleY);

function getDistance(point1, point2) {
    return Math.sqrt(Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2));
}

function getClosestPathNode(classroom, paths) {
    let closestPath;
    let shortestDistance = Infinity;

    for (let key in paths) {
        let path = paths[key];
        let distance = getDistance(classroom, path);
        if (distance < shortestDistance) {
            shortestDistance = distance;
            closestPath = path;
        }
    }

    return closestPath;
}

function setupGrid(width, height, paths, walls) {
    let grid = new PF.Grid(width, height);

    // Check if walls data is defined and is an array before attempting to use it
    if (Array.isArray(walls)) {
        walls.forEach(wall => {
            let points = getLinePoints(wall.start, wall.end);
            points.forEach(point => {
                grid.setWalkableAt(point.x, point.y, false);
            });
        });
    } else {
        console.error('Walls data is not loaded or not an array:', walls);
    }

    return grid;
}


// Implement Bresenham's line algorithm (or another line-drawing algorithm)
// to get all the points on a line from start to end
function getLinePoints(start, end) {
    let points = [];

    let x0 = start.x;
    let y0 = start.y;
    const x1 = end.x;
    const y1 = end.y;

    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);

    const sx = (x0 < x1) ? 1 : -1;
    const sy = (y0 < y1) ? 1 : -1;

    let err = dx + dy;
    let e2;

    while (true) {
        points.push({ x: x0, y: y0 });
        if (x0 === x1 && y0 === y1) break;
        e2 = 2 * err;
        if (e2 >= dy) {
            err += dy;
            x0 += sx;
        }
        if (e2 <= dx) {
            err += dx;
            y0 += sy;
        }
    }

    return points;
}

function findPathBetweenNodes(startNode, endNode, grid) {
    let finder = new PF.AStarFinder();
    return finder.findPath(startNode.x, startNode.y, endNode.x, endNode.y, grid.clone());
}

function findCompleteRoute(classroomA, classroomB, paths,walls) {
    let grid = setupGrid(1500,1500,paths,walls);

    let startPathNode = getClosestPathNode(classroomA, paths);
    let endPathNode = getClosestPathNode(classroomB, paths);

    console.log('startPathNode:', startPathNode);
    console.log('endPathNode:', endPathNode);

    if (!startPathNode || !endPathNode) {
        console.error('One of the path nodes is undefined.');
        return null;
    }

    let mainPath = findPathBetweenNodes(startPathNode, endPathNode, grid);

    if (!mainPath || mainPath.length === 0) {
        console.error('Main path is empty or undefined.');
        return null;
    }

    let completePath = [[classroomA.x, classroomA.y], ...mainPath, [classroomB.x, classroomB.y]];

    return completePath;
}

function routeToSVGPath(route) {
    if (route.length === 0) return "";

    let pathData = "M" + route[0][0] + " " + route[0][1];
    for (let i = 1; i < route.length; i++) {
        pathData += " L" + route[i][0] + " " + route[i][1];
    }

    return pathData;
}

function drawSVGRoute(route, svgContainerId) {
    let svgContainer = document.getElementById(svgContainerId);
    if (!svgContainer) {
        console.error('SVG container element not found.');
        return;
    }

    let svgElement = svgContainer.querySelector('svg');
    if (!svgElement) {
        console.error('SVG element not found inside the container.');
        return;
    }

    // Clear any existing paths and circles
    clearSVGPaths(svgContainerId);

    // Transform the route coordinates
    let transformedRoute = route.map(point => {
        return {
            x: point[0] * scaleX + translateX,
            y: point[1] * scaleY + translateY
        };
    });

    // Generate the SVG path data using the transformed route
    let pathData = "M" + transformedRoute[0].x + "," + transformedRoute[0].y;
    for (let i = 1; i < transformedRoute.length; i++) {
        pathData += " L" + transformedRoute[i].x + "," + transformedRoute[i].y;
    }

    // Create the new path element
    let newPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    newPath.setAttribute('d', pathData);
    newPath.setAttribute('stroke', 'blue');
    newPath.setAttribute('fill', 'none');
    newPath.setAttribute('stroke-width', '6');
    svgElement.appendChild(newPath);

    // Create the start circle
    let startCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    startCircle.setAttribute('cx', transformedRoute[0].x);
    startCircle.setAttribute('cy', transformedRoute[0].y);
    startCircle.setAttribute('r', '15'); // radius of the circle
    startCircle.setAttribute('fill', 'red');
    svgElement.appendChild(startCircle);

    // Create the end circle
    let endCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    endCircle.setAttribute('cx', transformedRoute[transformedRoute.length - 1].x);
    endCircle.setAttribute('cy', transformedRoute[transformedRoute.length - 1].y);
    endCircle.setAttribute('r', '15'); // radius of the circle
    endCircle.setAttribute('fill', 'green');
    svgElement.appendChild(endCircle);
}

function clearSVGPaths(svgContainerId) {
    let svgContainer = document.getElementById(svgContainerId);
    if (!svgContainer) {
        console.error('SVG container element not found.');
        return;
    }

    let svgElement = svgContainer.querySelector('svg');
    if (!svgElement) {
        console.error('SVG element not found inside the container.');
        return;
    }

    // Remove paths and circles
    let elementsToRemove = svgElement.querySelectorAll('path, circle');
    elementsToRemove.forEach(el => el.remove());
}

$(document).ready(function() {
    loadSVG(1);
    
    loadJSONData().then(() => {
        console.log('All JSON data has been loaded.');
        // Now that data is loaded, you can enable the search button
        $('#SearchButton').prop('disabled', false);
    }).catch(error => {
        console.error('Error loading JSON data:', error);
    });

    $('#fromLocation, #toLocation').change(function() {
        let selectedClassroom = $(this).val();
    
        let floorNumber;
        if (selectedClassroom.startsWith('G2')) {
            floorNumber = 1; // G2 classrooms are on the first floor
        } else if (selectedClassroom.match(/^[A-FH-Z]2/)) {
            floorNumber = 2; // Classrooms starting with any letter except 'G', followed by '2', are on the second floor
        } else if (selectedClassroom.startsWith('G3')) {
            floorNumber = 2; // G3 classrooms are on the second floor
        } else {
            floorNumber = 1; // Default to the first floor for any other case
        }
    
        loadSVG(floorNumber);
    });
    
    $("#SearchButton").click(function() {
        let fromLocation = $("#fromLocation").val();
        let toLocation = $("#toLocation").val();

        console.log('From location:', fromLocation);
        console.log('To location:', toLocation);
        console.log('Current floor:', currentFloor);

        let classrooms = mapData[`floor${currentFloor}`].classrooms;
        let paths = mapData[`floor${currentFloor}`].paths;

        console.log('Classrooms data:', classrooms);
        console.log('Paths data:', paths);

        let classroomA = classrooms[fromLocation];
        let classroomB = classrooms[toLocation];

        console.log('classroomA:', classroomA);
        console.log('classroomB:', classroomB);

        if (!classroomA || !classroomB) {
            console.error('One of the classroom details is undefined.');
            return;
        }

        let walls = mapData[`floor${currentFloor}`].walls;
        if (!Array.isArray(walls)) {
            console.error(`Walls data is not loaded for floor ${currentFloor}`);
            return; // Exit early if walls data isn't loaded
        }
        let route = findCompleteRoute(classroomA, classroomB, paths, walls);

        if (route) {
            clearSVGPaths("yourSVGElementId");
            drawSVGRoute(route, "yourSVGElementId");
        } else {
            console.error('No route found.');
        }

        let svgContainer = document.getElementById('svgContainer');
        if (svgContainer && svgContainer.querySelector('svg')) {
            clearSVGPaths("svgContainer");
            drawSVGRoute(route, "svgContainer");
        } else {
            console.error("SVG is not loaded yet.");
        }

    });
});