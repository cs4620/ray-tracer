const x = 0;//Index of x coordinate
const y = 1;//Index of y coordinate
const z = 2;//Index of z coordinate

const redShader = (u, v, x, y, z) => {
  return [1, 0, 0];
}

const subtract = (one, two) => [one[x] - two[x], one[y] - two[y], one[z] - two[z]];
const add = (one, two) => [one[x] + two[x], one[y] + two[y], one[z] + two[z]];
const scale = (one, two) => [one[x] * two, one[y] * two, one[z] * two];
const lengthSquared = v3 => v3[x] ** 2 + v3[y] ** 2 + v3[z] ** 2;
const length = v3 => Math.sqrt(lengthSquared(v3));
const normalize = v3 => {
  let l = length(v3);
  return [v3[x] / l, v3[y] / l, v3[z] / l]
}
const dot = (one, two) => one[x] * two[x] + one[y] * two[y] + one[z] * two[z];
const cross = (one, two) => [
  one[y] * two[z] - one[z] * two[y],
  one[z] * two[x] - one[x] * two[z],
  one[x] * two[y] - one[y] * two[x]
]
const orthogonal = (one, two) => normalize(cross(one, two));

const planeABC = arr => orthogonal(subtract(arr[1], arr[0]), subtract(arr[2], arr[1]))
const planeD = (one, two) => -dot(one, two)
const planeABCD = arr => { let abc = planeABC(arr); return { abc, d: planeD(abc, arr[0]) } }
const planeOffset = (abcd, p) => dot(abcd.abc, p) + abcd.d;




onmessage = function (event) {
  let { x, y, width, height, fullWidth, fullHeight } = event.data;


  let triangles = [
    {
      shader: redShader,
      points: [[-.5, -.1, 0], [.5, -.1, 0], [0, .5, 0]]
    }
  ];

  let camera = {
    from: [0, 0, 1],
    to: [0, 0, 0],
    up: [0, 1, 0],
    halfAngle: Math.PI / 4 //45 degrees
  };

  let lights = [
    {
      type: "directional",
      from: [1, 1, 0],
      to: [0, 0, 0]
    }
  ];



  let rand = Math.floor(Math.random() * 255);

  let imageData = [];

  let screenHalfWidth = Math.sin(camera.halfAngle);
  let screenHalfHeight = Math.cos(camera.halfAngle);

  let cameraForward = normalize(subtract(camera.to, camera.from));
  let cameraRight = cross(cameraForward, camera.up);
  let cameraUp = cross(cameraRight, cameraForward);
  let cameraRightScaled = scale(cameraRight, 1 / Math.sqrt(2))
  let cameraUpScaled = scale(cameraUp, 1 / Math.sqrt(2))

  for (var i = 0; i < width * height; i++) {
    let _x = x + i % width;
    let _y = y + Math.floor(i / width)

    let clipX = _x / fullWidth * 2 - 1;
    let clipY = _y / fullHeight * 2 - 1;

    clipX = 0;
    clipY = 0;

    let worldPosition = add(add(add(camera.from, cameraForward), scale(cameraRightScaled, clipX)), scale(cameraUpScaled, clipY))
    let rayDirection = normalize(subtract(worldPosition, camera.from));

    let minT = Number.MAX_VALUE;
    let minIndex = -1;

    for (let i = 0; i < triangles.length; i++) {
      let triangle = triangles[i];
      let points = triangle.points;
      //let abc = planeABC(triangle.points);
      //let d = planeD(abc, points[0]);
      let { abc, d } = planeABCD(points);


      let t = (-d - dot(abc, camera.from)) / (dot(abc, rayDirection));
      let collision = add(camera.from, scale(rayDirection, t))
      //console.log(collision);

      let bounds = [];
      bounds.push(planeABCD([points[1], points[0], add(points[0], abc)]))
      bounds.push(planeABCD([points[2], points[1], add(points[1], abc)]))
      bounds.push(planeABCD([points[0], points[2], add(points[2], abc)]))

      let offsets = bounds.map(b => planeOffset(b, collision));
      let min = Math.min(...offsets);
      if (min > 0) {
        //We're inside the triangle
        if (t < minT) {
          minT = t;
          minIndex = i
        }
      }



    }
    if (minIndex != -1) {
      imageData.push(_x / fullWidth * 255);
      imageData.push(_y / fullHeight * 255);
      imageData.push(0);
    }
    else {
      imageData.push(_x / fullWidth * 255);
      imageData.push(_y / fullHeight * 255);
      imageData.push(0);
    }
  }

  setTimeout(() => postMessage({ x, y, width, height, imageData }), 1)
}