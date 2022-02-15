function GPSVis(gpsData, employeeData, selectedEmployee) { // insert object instances into the parameters
    let self = this;

    self.gpsData = gpsData;
    self.employeeData = employeeData;
    self.selectedEmployee = selectedEmployee;
    self.init();
};

GPSVis.prototype.init = function () {
    let self = this;

    // do stuff
}

GPSVis.prototype.update = function() {
    let self = this;
    if (this.selectedEmployee[0] == "All" && this.selectedEmployee[1] == "Employees") {
        console.log(self.gpsData);
    }
    else {
        let employeeID;
        for (let i = 0; i < self.employeeData.length; i++) {
            if (self.employeeData[i].FirstName == this.selectedEmployee[0] && self.employeeData[i].LastName == this.selectedEmployee[1]) {
                employeeID = self.employeeData[i].CarID;
            }
        }
    
        let employeeGPS = self.gpsData.filter(filterGPS);
        function filterGPS(value) {
            return value.id == employeeID;
        }
        console.log(employeeGPS); 
    }
}