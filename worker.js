const x = 0;//Index of x coordinate
const y = 1;//Index of y coordinate
const z = 2;//Index of z coordinate

//Vector operations. Notice I always return a new array
//Subtract two vectors
const subtract = (one, two) => [one[x] - two[x], one[y] - two[y], one[z] - two[z]];
//Add two vectors
const add = (one, two) => [one[x] + two[x], one[y] + two[y], one[z] + two[z]];
//Scale a vector
const scale = (one, two) => [one[x] * two, one[y] * two, one[z] * two];
//Get the length squared of a vector
const lengthSquared = v3 => v3[x] ** 2 + v3[y] ** 2 + v3[z] ** 2;
//Get the length of a vector
const length = v3 => Math.sqrt(lengthSquared(v3));
//Get a copy of the vector with length 1
const normalize = v3 => {
  let l = length(v3);
  return [v3[x] / l, v3[y] / l, v3[z] / l]
}
//Calculate the dot product of two vectors
const dot = (one, two) => one[x] * two[x] + one[y] * two[y] + one[z] * two[z];
//Calculate the crosss product of two vectors
const cross = (one, two) => [

  one[y] * two[z] - one[z] * two[y],
  one[z] * two[x] - one[x] * two[z],
  one[x] * two[y] - one[y] * two[x]
]
//Find a normalized, orthogonal vector. 
const orthogonal = (one, two) => normalize(cross(one, two));
//Given three points, find the A,B,and C values of the containning plane
const planeABC = arr => orthogonal(subtract(arr[1], arr[0]), subtract(arr[2], arr[1]))
//Given a point on a plane and the values of A, B, and C, calculate D
const planeD = (abc, two) => -dot(abc, two)
//Given an array of vectors, calculate both abc and d.
const planeABCD = arr => { let abc = planeABC(arr); return { abc, d: planeD(abc, arr[0]) } }
//Given the definition of a plane and a point in space, calculate how far that point is from the plane
const planeOffset = (abcd, p) => dot(abcd.abc, p) + abcd.d;

//Respond to messages from the main thread
onmessage = function (event) {
  //Retrieve the bounds for this thread
  let { x, y, width, height, fullWidth, fullHeight } = event.data;

  //The list of triangle we are rendering
  let triangles = [
    {
      points: [[-.5, -.1, 0], [.5, -.1, 0], [0, .5, 0]]
    }
  ];

  //The camera definition
  let camera = {
    from: [0, 0, 1],
    to: [0, 0, 0],
    up: [0, 1, 0],
    halfAngle: Math.PI / 4 //45 degrees
  };

  //where we store the results of this thread's computation
  let imageData = [];

  //Get the basis for the camera
  //Calculate the normalized camera forward vector
  let cameraForward = normalize(subtract(camera.to, camera.from));
  //Use the cross product to get the right vector
  let cameraRight = cross(cameraForward, camera.up);
  //Get the up vector. We need this to make sure all the axes are orthogonal
  let cameraUp = cross(cameraRight, cameraForward);
  //Get the world-space half width of the frustum  
  let cameraRightScaled = scale(cameraRight, 1 / Math.sqrt(2))
  //Get the world-space half height of the frustum
  let cameraUpScaled = scale(cameraUp, 1 / Math.sqrt(2))

  //Loop over every pixel this thread should render
  for (var i = 0; i < width * height; i++) {
    //The screen space coordinate of the pixel in x
    let _x = x + i % width;
    //The screen space coordinate of the pixel in y
    let _y = y + Math.floor(i / width)

    //The clipping space coordinate of the pixel in x
    let clipX = _x / fullWidth * 2 - 1;
    //The clipping space coordinate of the pixel in y
    let clipY = _y / fullHeight * 2 - 1;

    //The world space position of the pixel
    let worldPosition = add(add(add(camera.from, cameraForward), scale(cameraRightScaled, clipX)), scale(cameraUpScaled, clipY))
    //The normalized direction from the camera origin to the world space position of the pixel
    let rayDirection = normalize(subtract(worldPosition, camera.from));

    //Collide against all triangles and see which is closest
    let minT = Number.MAX_VALUE;
    let minIndex = -1;

    for (let i = 0; i < triangles.length; i++) {
      let triangle = triangles[i];
      let points = triangle.points;
      let { abc, d } = planeABCD(points);

      //Calculate the distance to the ray/plane collision
      let t = (-d - dot(abc, camera.from)) / (dot(abc, rayDirection));
      //Get the world space location of the collision
      let collision = add(camera.from, scale(rayDirection, t))


      //Calculate the bounding planes of the triangle
      let bounds = [];
      bounds.push(planeABCD([points[1], points[0], add(points[0], abc)]))
      bounds.push(planeABCD([points[2], points[1], add(points[1], abc)]))
      bounds.push(planeABCD([points[0], points[2], add(points[2], abc)]))

      //Calculate the offset to each plane
      let offsets = bounds.map(b => planeOffset(b, collision));
      //Get the minimum offset. If this is negative, we are not in the triangle
      let min = Math.min(...offsets);
      
      //If we are inside the triangle, update our minimum information
      if (min > 0) {
        if (t < minT) {
          minT = t;
          minIndex = i
        }
      }
    }
    //Now deterime the color base on whether or not we collided with the triangle.
    if (minIndex != -1) {
      imageData.push(_x / fullWidth * 255);
      imageData.push(_y / fullHeight * 255);
      imageData.push(0);
    }
    else {
      imageData.push(0);
      imageData.push(0);
      imageData.push(0);
    }
  }

  //Send the results back to the main thread.
  setTimeout(() => postMessage({ x, y, width, height, imageData }), 1)
}