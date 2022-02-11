// Window-level data.
const winW = window.innerWidth;
const winH = window.innerHeight;
const mapScale = 0.30;
var centerPt = [0.0, 0.0];
var projection = d3.geoEquirectangular();

// Set up the map.
const mapContainer = d3.select("#map-container");
const mapPath = "./data/MC2-tourist.jpg";
mapContainer.append("img")
  .attr("id", "map-img")
  .attr("src", mapPath)
  .attr("width", 800)   // Temp height and width.
  .attr("height", 600);

// Scale map image to a reasonable size.
const mapImg = document.getElementById("map-img");
mapImg.onload = function() {
    if (mapImg.naturalWidth > winW)
    {
      mapImg.width = mapImg.naturalWidth * mapScale;
      mapImg.height = mapImg.naturalHeight * mapScale;
    }
}

// Read the data.
d3.csv("./data/gps.csv")
  .then(function(data){
    getCoordMinMax(data).then((value) => {
      // value format:
      // minLat, minLon, maxLat, maxLon

      // Projection coordinates (lon, lat) to match X, Y grid.
      // lon range: -180, 180
      // lat range: -90, 90`
      let minLat = Number(value[0]);
      let minLon = Number(value[1]);
      let maxLat = Number(value[2]);
      let maxLon = Number(value[3]);
      let centerLat = (minLat + maxLat) / 2.0;
      let centerLon = (minLon + maxLon) / 2.0;
      projection
        .scale(500000) // TODO validate this value to ensure points are correct.
        .center([centerLon, centerLat]);
      let path = d3.geoPath().projection(projection);

      // Set up the svg layer where points will be added.
      let svg = mapContainer.append("svg")
        .attr("id", "map-svg")
        .attr("width", mapImg.width)
        .attr("height", mapImg.height)
        .attr("style", "background: url('" + mapPath + "') no-repeat;background-size: contain;");
      svg.lower();
      mapImg.remove();

      // Calculate the center point. Leaving as an example for now.
      centerPt = [centerLon, centerLat];
      //console.log("CenterPt:");
      //console.log(centerPt);
      //svg.selectAll("circle")
      //  .data([centerPt,]).enter()
      //  .append("circle")
      //  .attr("cx", function (d) {
      //    return projection(d)[0];
      //  })
      //  .attr("cy", function (d) {
      //    return projection(d)[1];
      //  })
      //  .attr("r", "10px")
      //  .attr("fill", "red");
      //console.log("added first set of pts...");

      addRandomPoints(data).then((value) => {
        console.log("added points");
      });
    }); // End of GetCoordMinMax
  })
  .catch(function(error){
    console.log("error reading gps data:");
    console.log(error);
});

// Async determine lat/lon min/max values.
async function getCoordMinMax(data) {
  let minLat = 90.0;
  let minLon = 180.0;
  let maxLat = -90.0;
  let maxLon = -180.0;

  // Iterate over the csv rows. This assumes 'data' is gps.csv
  // for now.
  for (const item of data)
  {
    if (item.lat < minLat)
    {
      minLat = item.lat;
    }
    if (item.lat > maxLat)
    {
      maxLat = item.lat;
    }
    if (item.long < minLon)
    {
      minLon = item.long;
    }
    if (item.long > maxLon)
    {
      maxLon = item.long;
    }
  }
  return new Array(minLat, minLon, maxLat, maxLon);
}

async function addRandomPoints(data) {
  let svg = d3.select("#map-svg");
  let idx = 0;
  let num1 = Math.floor(Math.random() * data.length);
  let num2 = Math.floor(Math.random() * data.length);
  let num3 = Math.floor(Math.random() * data.length);
  let num4 = Math.floor(Math.random() * data.length);
  let num5 = Math.floor(Math.random() * data.length);
  let pts = [];
  for (const item of data) {
    if (idx === num1 || // Just for testing.
        idx === num2 ||
        idx === num3 ||
        idx === num4 ||
        idx === num5)
    {
      var pt = [Number(item.long), Number(item.lat)];
      pts.push(pt);
    }
    idx = idx + 1;
  }
  svg.selectAll("circle")
        //.Why doesn't this work just passing [pts]?
        .data([pts[0], pts[1], pts[2], pts[3], pts[4]]).enter()
        .append("circle")
        .attr("cx", function (d) {
          console.log(projection(d));
          return projection(d)[0];
        })
        .attr("cy", function (d) {
          console.log(projection(d));
          return projection(d)[1];
        })
        .attr("r", "10px")
        .attr("fill", "red");
}
