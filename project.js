// Window-level data.
const winW = window.innerWidth;
const winH = window.innerHeight;
const mapScale = 0.30;
var centerPt = [0.0, 0.0];
var projection;

// Set up the map.
const mapContainer = d3.select("#map-container");
const mapPath = "./data/MC2-tourist.jpg";
mapContainer.append("img")
  .attr("id", "map-img")
  .attr("src", mapPath);

// Scale map image to a reasonable size.
const mapImg = document.getElementById("map-img");
mapImg.onload = function() {
    if (mapImg.naturalWidth > winW)
    {
      mapImg.width = mapImg.naturalWidth * mapScale;
      mapImg.height = mapImg.naturalHeight * mapScale;
      console.log("mapwidth: " + mapImg.width);
      console.log("mapheight: " + mapImg.height);
    }
}

//d3.csv("./data/gps.csv")
//  .row(function(d) { return {key: d.key, value: d.value}; })
//  .get(function(error, rows) { console.log(rows); });


d3.csv("data/employee-data.csv")
  .then(function(employeeData) {

    console.log(employeeData);

    let employeeDropdown = document.getElementById("employee-dropdown");
    let employeeSelect = document.getElementById("employee-list");

    let dropdownLabel = document.createElement("label");
    dropdownLabel.innerHTML = "Select an employee";
    dropdownLabel.htmlFor = "employees";

    let allOption = document.createElement("option");
    allOption.value = "All Employees";
    allOption.text = "All Employees";
    employeeDropdown.append(allOption);

    for (i = 0; i < employeeData.length; i++) {
        let option = document.createElement("option");
        option.value = employeeData[i].FirstName + " " + employeeData[i].LastName;
        option.text = employeeData[i].FirstName + " " + employeeData[i].LastName;
        employeeDropdown.append(option);
    }

    // Adding code here to add other checkpoint elements
    for (i = 0; i < employeeData.length; i++) {
      let label = document.createElement("label");
      label.className = "list-group-item";
      // let input = document.createElement("input");
      // input.className = "form-check-input me-1";
      // input.type = "checkbox"
      let inputLabel = "" + employeeData[i].FirstName + " " + employeeData[i].LastName;
      // input.setAttribute("value", inputLabel);
      // input.value = inputLabel;
      // label.append(input);
      label.innerHTML = "<input class=\"form-check-input me-1\" type=\"checkbox\" value=\"\"></input>" + inputLabel
      employeeSelect.append(label);
    }

    employeeDropdown.addEventListener('change', function() {
      let selectedEmployee;
      if (this.value == "all") {
        selectedEmployee = ["All", "Names"];
      }
      else {
        selectedEmployee = this.value.split(" ");
      }    
      console.log(selectedEmployee);
      d3.csv("data/gps.csv")
        .then(function(gpsData) {
          let gpsVis = new GPSVis(gpsData, employeeData, selectedEmployee);
          gpsVis.update();
        }); // End of reading gps data from csv.
    }); // End of employee dropdown event listener.

    // Read GPS data on page load to populate map with points.
      // TODO cache this on page load so that 'employeeDropdown'
      // doesn't re-read this.
    d3.csv("data/gps.csv")
      .then(function(gpsData) {
        populateMapData(gpsData);
      });
  }); // End of reading employee data from csv.

function populateMapData(gpsData)
{
  // Spawn random points.
  getCoordMinMax(gpsData).then((value) => {
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
    projection = d3.geoEquirectangular()
      .center([centerLon, centerLat])
      .translate([mapImg.width / 2, mapImg.height / 2])
      .scale(500000); // TODO not confirmed correct.

    // Set up the svg layer where points will be added.
    let svg = mapContainer.append("svg")
      .attr("id", "map-svg")
      .attr("width", mapImg.width)
      .attr("height", mapImg.height)
      .attr("style", "background: url('" + mapPath + "') no-repeat;background-size: contain;");
    svg.lower();
    mapImg.remove();

    addRandomPoints(gpsData).then((value) => {
      console.log("added points");
    });
  }); // End of GetCoordMinMax
}

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
      var pt = new Object();
      pt.coord = [Number(item.long), Number(item.lat)];
      pt.id = item.id;
      pt.date = item.Timestamp;
      pts.push(pt);
    }
    idx = idx + 1;
  }

  /*
   * Tooltip code: https://techblog.assignar.com/plotting-data-points-on-
   * interactive-map-visualisation-using-d3js/
   */
  let tooltip = d3.select("#map-container")
    .append("div")
    .attr("id", "tooltip")
    .style("position", "absolute")
    .style("text-align", "left")
    .style("padding", "15px")
    .style("font", "12px sans-serif")
    .style("background", "#ffffff")
    .style("border", "0px")
    .style("border-radius", "8px")
    .style("z-index", "10")
    .style("visibility", "hidden")
    .text("empty tooltip");

  svg.selectAll("circle")
        .data(pts).enter()
        .append("circle")
        .attr("cx", function (d) {
          console.log("cx: " + d.coord[0]);
          console.log(projection(d.coord));
          return projection(d.coord)[0];
        })
        .attr("cy", function (d) {
          console.log("cy: " + d.coord[1]);
          console.log(projection(d.coord));
          return projection(d.coord)[1];
        })
        .attr("r", "10px")
        .attr("fill", "red")
        .on("mouseover", (e, d) => {
          let idText = 'ID: ' + d.id;
          let dateText = '<br>Date: ' + d.date;
          let latText = '<br>Lat: ' + d.coord[1];
          let lonText = '<br>Lon: ' + d.coord[0];
          tooltip.html(idText + dateText + latText + lonText);
          tooltip.style("visibility", "visible");
          tooltip.style("top",
            (e.pageY - 10) + "px")
            .style("left", (e.pageX + 10) + "px");
          d3.select("#tooltip").lower();
          return tooltip;
        })
        .on("mouseleave", (e, d) => {
          tooltip.raise();
          tooltip.text("empty tooltip");
          tooltip.style("visibility", "hidden");
        });
}
