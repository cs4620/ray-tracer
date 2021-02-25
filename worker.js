

onmessage = function(event){
  let x = event.data.x;
  let y = event.data.y;
  let width = event.data.width;
  let height = event.data.height;

  let rand = Math.floor(Math.random() * 255);
  
  let imageData = [];
  
  for(var i= 0; i < width * height; i++){
    imageData.push(rand);
    imageData.push(rand);
    imageData.push(rand);
  }

  setTimeout(()=> postMessage({x, y, width, height, imageData}), Math.random() * 1000 + 1000)
}