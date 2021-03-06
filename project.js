// Window-level data.
const winW = window.innerWidth;
const winH = window.innerHeight;
const mapScale = 0.30;
const maxDataPoints = 80000;
var centerPt = [0.0, 0.0];
var projection;

// Array containing currently-selected employee names.
var g_CheckedEmployees = [];

// Set up the map container.
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
      console.log("Map width: " + mapImg.width);
      console.log("Map height: " + mapImg.height);
    }
}

// Set the page alert to indicate loading...
const pageAlertText = d3.select("#page-alert-text");

// Init. page state here that doesn't rely on CSV data.
$(document).ready(
      function() {
        initDatePickers();
        initTimePickers();
        // Disabled/hidden until page data loads.
        $("#btnUpdateMap").prop("disabled",true);
        $("#btnUpdateMap").hide();
      }
  );

/*
 * Data objects ranked by size; lower index means larger
 * file size. These vars can be used to access the CSV
 * data anywhere in the page once they are valid (after
 * onDataReady() is reached.)
 */
var g_gpsData;           // 1
var g_ccData;            // 2
var g_loyaltyData;       // 3
var g_carAssignmentData; // 4
var g_employeeData;      // 5

// Preload all of the data.
d3.csv("data/gps.csv")
  .then(function(gpsData) {
    g_gpsData = gpsData;

    d3.csv("data/cc_data.csv")
      .then(function(ccData) {
        g_ccData = ccData;

        d3.csv("data/loyalty_data.csv")
          .then(function(loyaltyData) {
            g_loyaltyData = loyaltyData;

            d3.csv("data/car-assignments.csv")
              .then(function(carData) {
                g_carAssignmentData = carData;

                d3.csv("data/employee-data.csv")
                  .then(function(employeeData) {
                    g_employeeData = employeeData;

                    /*
                     * Fire the ready signal. Use as an entry point
                     * for the rest of the page code.
                     */
                    onDataReady();
                });
            });
        });
    });
});


/*
 * This function fires when all data is guaranteed to be
 * available in the window. Use the g_ vars to retrieve
 * any of the CSV data.
 */
function onDataReady() {
  initEmployeeColumn(g_employeeData);
  initMapButton();
  initMapSvgLayer(g_gpsData);

  // Now we can enable the update button.
  $("#btnUpdateMap").prop("disabled",false);
  $("#btnUpdateMap").show();

  // Update the page alert now that all loading is done.
  pageAlertText.style("white-space", "pre-wrap");
  pageAlertText.text("Specify a query by selecting employees and a datetime range." +
    " Then, click 'Update Map' to display the\ndata. Additional employees can be added" +
    " to a query by checking their names on the left and clicking\n'Update Map' again." +
    " The map is limited to " + maxDataPoints + " points for any given time range.");
}

function initDatePickers() {
  /*
   * Hard-code the datepicker settings since the CSV data gets
   * loaded afterwards.
   */
  let defaultStartDate = "01/06/2014";
  let defaultEndDate = "01/19/2014";
  $("#datepickerFrom").val(defaultStartDate);
  $("#datepickerTo").val(defaultEndDate);
  $("#datepickerFrom").datepicker(
    {
      defaultDate: defaultStartDate,
      minDate: defaultStartDate,
      maxDate: defaultEndDate,
      onClose: function(dateText, inst) {
          console.log("From date: " + dateText);
      }
    }
  );
  $("#datepickerTo").datepicker(
    {
      defaultDate: defaultEndDate,
      minDate: defaultStartDate,
      maxDate: defaultEndDate,
      onClose: function(dateText, inst) {
          console.log("To date: " + dateText);
      }
    }
  );
}

function initTimePickers() {
  // Again, hard-code the time picker defaults so they don't change.
  $("#timepickerStart").timepicker({
      timeFormat: 'HH:mm:ss',
      interval: 30,
      minTime: '06:00:00',
      maxTime: '22:59:59',
      defaultTime: '',
      startTime: '06:00:00',
      dynamic: false,
      dropdown: true,
      scrollbar: true,
      change: function(time) {
        // 'time' is a Date obj.
        let inputObj = $(this);
        let tp = inputObj.timepicker();

        /* We don't want any logic to fire when the time picker changes
         * so leave this blank.
         */
      }
  });
  $("#timepickerEnd").timepicker({
      timeFormat: 'HH:mm:ss',
      interval: 30,
      minTime: '06:00:00',
      maxTime: '22:59:59',
      defaultTime: '',
      startTime: '06:00:00',
      dynamic: false,
      dropdown: true,
      scrollbar: true,
      change: function(time) {
        // 'time' is a Date obj.
        let inputObj = $(this);
        let tp = inputObj.timepicker();

        /* We don't want any logic to fire when the time picker changes
         * so leave this blank.
         */
      }
  });

  // Set the default time range on page load.
  $("#timepickerStart").val("06:00:00");
  $("#timepickerEnd").val("07:00:00");
}

function initMapButton() {
  let btn = $("#btnUpdateMap");

  // Force the button to the map width.
  btn.width(mapImg.width);
  btn.css({
    "maxWidth": mapImg.width
  });
  btn.text("Update Map");

  // Connect the callback for running queries to the button.
  btn.on("click", onUpdateMap);
}

function initEmployeeColumn(employeeData) {
  let employeeDropdown = document.getElementById("employee-dropdown");
  let employeeSelect = document.getElementById("employee-list");

  let dropdownLabel = document.createElement("label");
  dropdownLabel.innerHTML = "Select an employee";
  dropdownLabel.htmlFor = "employees";

  let allOption = document.createElement("option");
  allOption.value = "All Employees";
  allOption.text = "All Employees";
  employeeDropdown.append(allOption);

  // Add all employee entries to the dropdown.
  for (i = 0; i < employeeData.length; i++) {
      let option = document.createElement("option");
      option.value = employeeData[i].FirstName + " " + employeeData[i].LastName;
      option.text = employeeData[i].FirstName + " " + employeeData[i].LastName;
      employeeDropdown.append(option);
  }

  // Add all employees to the checklist panel so multiple can be selected.
  for (i = 0; i < employeeData.length; i++) {
    let label = document.createElement("label");
    label.className = "list-group-item";
    let inputLabel = "" + employeeData[i].FirstName + " " + employeeData[i].LastName;
    label.innerHTML = "<input class=\"form-check-input me-1\" type=\"checkbox\" \
                        value=\"" + inputLabel + "\" \
                        onclick=\"updateCheckedEmployees(this)\"></input>" + inputLabel;
    employeeSelect.append(label);
  }
}

function initMapSvgLayer(gpsData) {
  // Set up the svg layer based on the min/max data found.
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
      .scale(550000); // Compared against Isia Vann route on Jan. 6, 0600-0900.
                      // Loreto Bodrogi has a similar route to compare against.

    // Create the actual svg layer.
    let svg = mapContainer.append("svg")
      .attr("id", "map-svg")
      .attr("width", mapImg.width)
      .attr("height", mapImg.height)
      .attr("style", "background: url('" + mapPath + "') \
            no-repeat;background-size: contain;");
    svg.lower();
    // Remove the raster image so data points will be visible.
    mapImg.remove();
  });
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

/* Debug function used for testing point rendering.
 * Just adds five random data points to the map.
 */
async function renderRandomPoints(data) {
  let idx = 0;
  let num1 = Math.floor(Math.random() * data.length);
  let num2 = Math.floor(Math.random() * data.length);
  let num3 = Math.floor(Math.random() * data.length);
  let num4 = Math.floor(Math.random() * data.length);
  let num5 = Math.floor(Math.random() * data.length);
  let pts = [];
  for (const item of data) {
    if (idx === num1 || // Hard limit to 5 for testing.
        idx === num2 ||
        idx === num3 ||
        idx === num4 ||
        idx === num5)
    {
      /* Store metadata on the point object so the hover dialog
       * can display it.
       */
      var pt = new Object();
      pt.coord = [Number(item.long), Number(item.lat)];
      pt.id = item.id;
      pt.date = item.Timestamp;
      pts.push(pt);
    }
    idx = idx + 1;
  }
  addPointsToMap(pts);
}

async function renderGPSDataToMap(data) {
  // Prevent the browser tab from crashing on huge data sizes.
  if (data.length > maxDataPoints) {
    alert("Error: Query larger than " + maxDataPoints +
      " points. Try a different time range.\n\n(Found " +
      data.length + " points.)");
    return;
  }

  // Display error when query finishes with no results.
  if (data.length < 1) {
    alert("Error: No results for selected employee(s) and datetime range.");
    return;
  }

  // Convert gps data lines to readable point objects.
  let pts = [];
  for (const line of data) {
    var pt = new Object();
    pt.coord = [Number(line.long), Number(line.lat)];
    pt.id = line.id;
    pt.date = line.Timestamp;
    pts.push(pt);
  }
  addPointsToMap(pts);
  console.log("Pts rendered:");
  console.log(pts);
}

function addPointsToMap(pts) {
  let svg = d3.select("#map-svg");
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

  // Add the data point circles to the DOM.
  svg.selectAll("circle")
        .data(pts).enter()
        .append("circle")
        .attr("cx", function (d) {
          //console.log("cx: " + d.coord[0]);
          //console.log(projection(d.coord));
          return projection(d.coord)[0];
        })
        .attr("cy", function (d) {
          //console.log("cy: " + d.coord[1]);
          //console.log(projection(d.coord));
          return projection(d.coord)[1];
        })
        .attr("r", "5px")    // Set circle radius.
        .attr("fill", "red") // Set circle color.
        .attr("opacity", 0.1) // Opacity works like a heatmap.
        .on("mouseover", (e, d) => {
          // Display data point info on hover.

          // Highlight point when hovered.
          $(e.target).attr("style","outline:3px solid blue");

          // Show employee data tooltip.
          let firstName = "Unknown";
          let lastName = " Employee";
          if (d.id <= 35)
          {
            firstName = g_carAssignmentData[d.id-1].FirstName;
            lastName = g_carAssignmentData[d.id-1].LastName;
          }
          let idText = 'ID: ' + d.id;
          let nameText = '<br>Name: ' + firstName + " " + lastName;
          let dateText = '<br>Date: ' + d.date;
          let latText = '<br>Lat: ' + d.coord[1];
          let lonText = '<br>Lon: ' + d.coord[0];
          tooltip.html(idText + nameText + dateText + latText + lonText);
          tooltip.style("visibility", "visible");
          tooltip.style("top",
            (e.pageY - 10) + "px")
            .style("left", (e.pageX + 10) + "px");
          d3.select("#tooltip").lower();
          return tooltip;
        })
        .on("mouseleave", (e, d) => {
          // When mouse leaves, undo all of the hover rendering.
          tooltip.raise();
          tooltip.text("empty tooltip");
          tooltip.style("visibility", "hidden");

          // Unhighlight point.
          $(e.target).attr("style","outline:0px solid blue");
        });
}

function onUpdateMap() {
  console.log("'Update Map' clicked.");

  // Clear the SVG data on the map.
  clearMapDataPoints();

  // Gather employee names.
  let names = getSelectedEmployees();
  console.log("Selecting data for the following names:");
  console.log(names);

  // Gather datetime data from UI state.
  let fromDate = $("#datepickerFrom").datepicker("getDate");
  let toDate = $("#datepickerTo").datepicker("getDate");
  let startTime = $("#timepickerStart").timepicker("getTime");
  let endTime = $("#timepickerEnd").timepicker("getTime");

  // Filter GPS data based on the UI selections.
  let queryData = [];
  let infoTable = document.getElementById("employee-info");

  /* Remove all children from Selected Transactions sidebar
   * and update with new data from query.
   */
  while (infoTable.firstChild) {
    infoTable.removeChild(infoTable.firstChild);
  }
  names.forEach(name => {
    let nameArr = name.split(" ");
    let gpsVis = new GPSVis(g_gpsData, g_employeeData, nameArr);
    let gpsData = gpsVis.getGPSDataByDateTime(fromDate, toDate, startTime, endTime);
    updateInfoTable(nameArr, startTime, endTime, fromDate, toDate);

    queryData = queryData.concat(gpsData);
  });

  // Style any new collapsible elements for the right-hand panel.
  let collapsibles = document.getElementsByClassName("collapsible");
  for (let i = 0; i < collapsibles.length; i++) {
    collapsibles[i].addEventListener("click", function() {
      this.classList.toggle("active");

      if (this.nextElementSibling.style.display == "block") {
        this.nextElementSibling.style.display = "none";
      }
      else {
        this.nextElementSibling.style.display = "block";
      }
    });
  }

  // Render the found data.
  renderGPSDataToMap(queryData);
}

// Dynamically updates employee info sidebar when map is updated to reflect the employees and timeframe
// Checks for loyalty and credit card data for the given employee.
function updateInfoTable(employeeName, startTime, endTime, fromDate, toDate) {
  // Find the relevant CC data.
  let selectedCC = g_ccData.filter( function(value) {
    if (employeeName.length == 2) {
      return (value.FirstName == employeeName[0] && value.LastName == employeeName[1])
    } else if (employeeName.length == 3) {
      let combinedLastName = employeeName[1] + " " + employeeName[2];
      return (value.FirstName == employeeName[0] && value.LastName == combinedLastName);
    } else {
      return false;
    }
  });
  selectedCC = selectedCC.filter( function(value) {
    let date = new Date(value.timestamp);

    startTime.setDate(fromDate.getDate());
    startTime.setMonth(fromDate.getMonth());
    startTime.setYear(fromDate.getFullYear());
    endTime.setDate(toDate.getDate());
    endTime.setMonth(toDate.getMonth());
    endTime.setYear(toDate.getFullYear());

    return (date.valueOf() >= startTime.valueOf() &&
    date.valueOf() <= endTime.valueOf());
  })

  // Find the relevant loyalty data.
  let selectedLoyalty = g_loyaltyData.filter( function(value) {
    if (employeeName.length == 2) {
      return (value.FirstName == employeeName[0] && value.LastName == employeeName[1])
    } else if (employeeName.length == 3) {
      let combinedLastName = employeeName[1] + " " + employeeName[2];
      return (value.FirstName == employeeName[0] && value.LastName == combinedLastName);
    } else {
      return false;
    }
  });
  selectedLoyalty = selectedLoyalty.filter( function(value) {
    let date = new Date(value.timestamp);

    startTime.setDate(fromDate.getDate());
    startTime.setMonth(fromDate.getMonth());
    startTime.setYear(fromDate.getFullYear());
    endTime.setDate(toDate.getDate());
    endTime.setMonth(toDate.getMonth());
    endTime.setYear(toDate.getFullYear());

    return (date.valueOf() >= startTime.valueOf() &&
    date.valueOf() <= endTime.valueOf());
  })

  console.log(selectedCC);
  console.log(selectedLoyalty);

  let uniqueCC = [...new Set(selectedCC.map(x => x.location))];
  let uniqueLoyalty = [...new Set(selectedLoyalty.map(x => x.location))];
  let info = document.createElement("div");
  let name = document.createTextNode(employeeName[0] + " " + employeeName[1]);

  let ccDiv = document.createElement("div");
  let ccHeader = document.createTextNode("Credit Card");
  ccDiv.appendChild(ccHeader);

  // Create the UI elements for the found CC and loyalty data.
  for (let i = 0; i < uniqueCC.length; i++) {
    let locationBtn = document.createElement("button");
    let id = uniqueCC[i].replace(/\s/g, '');
    locationBtn.innerHTML = uniqueCC[i];
    ccDiv.appendChild(locationBtn);
    locationBtn.setAttribute("class", "collapsible");

    let locationInfo = document.createElement("div");
    locationInfo.setAttribute("class", "collapsible-content");
    

    let list = document.createElement("ul");
    for (let j = 0; j < selectedCC.length; j++) {
      if (selectedCC[j].location == uniqueCC[i]) {
        let li = document.createElement("li");
        li.innerHTML = selectedCC[j].timestamp + " " + selectedCC[j].price;
        list.appendChild(li);
      }
    }
    locationInfo.appendChild(list);
    ccDiv.appendChild(locationInfo);
  }

  let loyaltyDiv = document.createElement("div");
  let loyaltyHeader = document.createTextNode("Loyalty");
  loyaltyDiv.appendChild(loyaltyHeader);

  for (let i = 0; i < uniqueLoyalty.length; i++) {
    let locationBtn = document.createElement("button");
    let id = uniqueLoyalty[i].replace(/\s/g, '');
    locationBtn.innerHTML = uniqueLoyalty[i];
    loyaltyDiv.appendChild(locationBtn);
    locationBtn.setAttribute("class", "collapsible");

    let locationInfo = document.createElement("div");
    locationInfo.setAttribute("class", "collapsible-content");
    

    let list = document.createElement("ul");
    for (let j = 0; j < selectedLoyalty.length; j++) {
      if (selectedLoyalty[j].location == uniqueLoyalty[i]) {
        let li = document.createElement("li");
        li.innerHTML = selectedLoyalty[j].timestamp + " " + selectedLoyalty[j].price;
        list.appendChild(li);
      }
    }
    locationInfo.appendChild(list);
    loyaltyDiv.appendChild(locationInfo);
  }

  // Add the found data to the right-hand panel.
  info.appendChild(name);
  info.appendChild(ccDiv);
  info.appendChild(loyaltyDiv);
  document.getElementById("employee-info").appendChild(info);
}


function clearMapDataPoints() {
  let svg = d3.select("#map-svg");
  svg.selectAll("circle").remove();
}

function getSelectedEmployees() {
  // Grab the dropdown name.
  let dropdownName = $("#employee-dropdown option:selected").text();

  // Grab all other selected names.
  let selections = [];
  if (dropdownName == "All Employees") {
    selections.push(dropdownName);
  } else {
    selections = g_CheckedEmployees.slice();
    if (!selections.includes(dropdownName)) {
      selections.push(dropdownName);
    }
  }

  // Return combined name selections.
  return selections;
}

function updateCheckedEmployees(input) {
  if (input.checked && !g_CheckedEmployees.includes(input.value)) {
    // Checked and doesn't exist, so add the name.
    g_CheckedEmployees.push(input.value);
  }
  if (!input.checked && g_CheckedEmployees.includes(input.value)) {
    // Unchecked and exists, so remove the name.
    g_CheckedEmployees = g_CheckedEmployees.filter(
      name => name != input.value
    );
  }
}
