//var data = [80, 120, 60, 150, 200];
//
//var barHeight = 20;
//
//var bar = d3.select('svg')
//          .selectAll('rect')
//          .data(data)
//          .enter()
//          .append('rect')
//          .attr('width', function(d) {  return d; })
//          .attr('height', barHeight - 1)
//          .attr('transform', function(d, i) {
//            return "translate(0," + i * barHeight + ")";
//          });

const mapContainer = d3.select("#map-container");
const mapPath = "./data/MC2-tourist.jpg";
mapContainer.append("img")
  .attr("id", "map-img")
  .attr("src", mapPath)
  .attr("width", 800)
  .attr("height", 600);

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
        })

    })
  })

