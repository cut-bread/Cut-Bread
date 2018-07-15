var breadCanvas;
var breads = ["breads/breadSlice0.png",""];
var bimg;
var slicing = false;
var slices = [];
var tempSlice = [];
var cHeight = 500;
var cWidth = 500;
var numOfSlices = 0;
var results = [];
function preload(){
  //Default bread slice selected for display
  bimg = loadImage(breads[0]);
}
function setup(){
  breadCanvas = createCanvas(500,500)
  breadCanvas.parent('cutbread');
  
  //Resolution density d
  d = pixelDensity();
  
  //Load the current pixels
  loadPixels();
  textAlign(CENTER)
  textSize(20)
}

function draw(){
  background(255,255,255)
  image(bimg,0,0,500,500)
  stroke(255,255,255)
  strokeWeight(5)
  
  //Display current slice
  if (slicing == true){
    line(tempSlice[tempSlice.length-2],tempSlice[tempSlice.length-1],mouseX,mouseY)
  }
  
  //If user has made a slice, slice array should be of length 4, we then display it
  displaySlices(slices);
  /*
  var zeon1 = [];
  for (var k = 0; k< 4*numOfSlices; k+=4){
    zeon1.push(side(mouseX,mouseY,slices[k],slices[k+1],slices[k+2],slices[k+3]));
  }
  var hash1 = hashRegion(zeon1);
  console.log(zeon1,hash1)
  */
  noStroke();
  for (var k=0;k<results.length;k++){
    text(results[k][0],results[k][1],results[k][2]);
  }
}

function mousePressed(){
  if (mouseY <= 525){
    //Complete the slice if done already
    if (slicing == true){
      slicing = false;
      numOfSlices++;
      tempSlice.push(mouseX,mouseY);

      slices.push(tempSlice[0],tempSlice[1],tempSlice[2],tempSlice[3]);
      tempSlice = [];

    }
    else{
      slicing = true;
      tempSlice.push(mouseX,mouseY);
    }
  }
  
}

//Check the slices for eveness!
function check(){
  calculateAreas(slices);
}

//quickly return the color of the pixels[] array as loaded by loadPixels() in RGBA format;
function fget(x,y){
  
  //y = parseInt(y.toFixed(0));
  var off = ((y*d*cWidth + x)*d*4);
  var components = [ pixels[off], pixels[off + 1], pixels[off + 2], pixels[off + 3] ]
  return components;
}

function calculateAreas(slices){
  //Calculate the area of the bread slices as a percentage
  //Essentially loop over the pixels array of the current canvas with the slice as displayed with a
  //White line. If a pixel is close to RGB(255,255,255), then its not a part of a piece of bread.
  results = [];
  if (slices.length < 4){
    //If no slices then its just one piece with 100%
    results.push(["100%",250,250])
    return;
  }
  var areas = {
    
  };
  var centersx = {};
  var centersy = {};
  
  loadPixels();
  
  for (var i = 0; i < cWidth; i++){
    for (var j = 0; j < cHeight; j++){
      colors = fget(i,j)
      if (colors[0] + colors[1] + colors [2] < 765){
        //Calculate which region it belongs to with hash function
        var zeon = [];
        for (var k = 0; k< 4*numOfSlices; k+=4){
          zeon.push(side(i,j,slices[k],slices[k+1],slices[k+2],slices[k+3]));
        }
        var hash = hashRegion(zeon);

        //If hash not initialized already, initialize it into areas object
        if (areas[hash]){
          areas[hash]++;
          centersx[hash] += i;
          centersy[hash] += j;
        }
        else{
          areas[hash] = 1;
          centersx[hash] = i;
          centersy[hash] = j;
        }
      }
    }
  }

  
  var totalArea = 0;
  //console.log("Left: " + areas[0]/totalArea, "Right: " + areas[1]/totalArea);
  
  for (hashKey in areas) {
    totalArea += areas[hashKey]
  }
  for (hashKey in areas) {
    var cx = centersx[hashKey]/areas[hashKey];
    var cy = centersy[hashKey]/areas[hashKey];;
    var percentAreaText = ((areas[hashKey]/totalArea) * 100).toFixed(2) + "%"
    results.push([percentAreaText,cx,cy])
  }
  return areas;
  
}

//Returns whether a point is within a polygon as defined by its vertices positions
function inPolygon(pos,vertices){
  //Vertices stored in format [[x,y],[x,y],...,[x,y]]
  //Pos stored as [x,y]
  totalArea = 0;
  expectedArea = pArea(vertices);
  for (var i = 0; i<vertices.length-1; i++){
    triangleV = [vertices[i], vertices[i + 1], pos[0], pos[1]];
    totalArea += tArea(triangleV);
    
  }
  if (totalArea > expectedArea){
    return false;
  }
  else {
    return true;
  }
}

//Return triangle area
function tArea(vertices){
  vertices = vertices.reduce(function(acc,curr){return acc.concat(curr)});
  //Flatten array by 1 level to get [x1,y1,x2,y2,x3,y3]
  return 0.5 * abs((vertices[0]-vertices[4]) * (vertices[3]-vertices[1]) - (vertices[0] - vertices[2]) * (vertices[5] - vertices[1]))
}

//Return polygon area
function pArea(vertices){
  vertices = vertices.reduce(function(acc,curr){return acc.concat(curr)});
  var det = 0;
  for (var i = 0; i < vertices.length/2 - 1; i++){
    if (i != floor(vertices.length/2)){
      det += vertices[2*i]*vertices[2*i + 3] - vertices[2*i + 2] * vertices[2*i + 1]
    }
    else {
      //If reached end, then
      det += vertices[2*i]*vertices[1] - vertices[0] * vertices[2*i + 1]
    }
  }
  return 0.5 * abs(det)
  
}

function displaySlices(slices){
  for (var i = 0; i < slices.length; i+=4){
    line(slices[i],slices[i+1],slices[i+2],slices[i+3]);
  }
}

//Return 0 or 1 for arbitrary side given point x1,y1 and line x2,y2 x3,y3
function side(x1,y1,x2,y2,x3,y3){
  var val = Math.sign((x3 - x2) * (y1 - y2) - (y3 - y2) * (x1 - x2))
  if (val == 0 || val == 1){
    return 0;
  }
  return 1;
}

//Using the 0's and 1's for choosing a side, generate a unique number for which area it is a part of
//Uses the fact that each subset of {1,-2,4,8,-16,...} is a unique subset in terms of the sum of its terms
function hashRegion(arr){
  var finalHash = 0;
  for (var i=0; i<arr.length; i ++){
    if (i%2 == 0){
      finalHash += arr[i] * pow(2 , i);
    }
    else{
      finalHash -= arr[i] * pow(2 , i);
    }
  }
  return finalHash;
}

//returns the vertices of the line if they were on the canvas border
function extendVertex(x1,y1,x2,y2){
  var dx = x2-x1;
  var dy = y2-y1;
  var slope = dy/dx;
  
}