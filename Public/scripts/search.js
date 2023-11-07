function loadJSONData() {
    let promises = [];

    ['floor1', 'floor2'].forEach(floor => {
        promises.push(
            $.getJSON(`/assets/${floor}_classrooms.json`, function(data) {
                mapData[floor].classrooms = data;
            }),
            $.getJSON(`/assets/${floor}_path.json`, function(data) {
                mapData[floor].paths = data;
            }),
            $.getJSON(`/assets/${floor}_stairs.json`, function(data) {
                mapData[floor].stairs = data;
            })
        );
    });

    return Promise.all(promises);
}

$(document).ready(function() {
    loadSVG(1);
    
    loadJSONData().then(() => {
        console.log('All JSON data has been loaded.');
    }).catch(error => {
        console.error('Error loading JSON data:', error);
    });

    $('#fromLocation, #toLocation').change(function() {
        let selectedClassroom = $(this).val();
        let floorNumber = (selectedClassroom.startsWith('O2') || selectedClassroom.startsWith('J1')) ? 2 : 1;
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

        let route = findCompleteRoute(classroomA, classroomB, paths);

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


let mapData = {
    floor1: {
        classrooms: null,
        paths: null,
        stairs: null
    },
    floor2: {
        classrooms: null,
        paths: null,
        stairs: null
    }
};

let currentFloor = 1;

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

function setupGrid(width, height, paths) {
    let grid = new PF.Grid(width, height);
    // Additional code might be needed here to set non-walkable areas based on the floor plan.
    return grid;
}

function findPathBetweenNodes(startNode, endNode, grid) {
    let finder = new PF.AStarFinder();
    return finder.findPath(startNode.x, startNode.y, endNode.x, endNode.y, grid.clone());
}

function findCompleteRoute(classroomA, classroomB, paths) {
    let grid = setupGrid(1000, 1000, paths);

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

    let pathData = routeToSVGPath(route);

    let pathElement = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pathElement.setAttribute("d", pathData);
    pathElement.setAttribute("stroke", "blue");
    pathElement.setAttribute("fill", "none");
    pathElement.setAttribute("stroke-width", "2");

    svgElement.appendChild(pathElement);
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

    let paths = svgElement.getElementsByTagName("path");
    while (paths.length > 0) {
        paths[0].parentNode.removeChild(paths[0]);
    }
}



