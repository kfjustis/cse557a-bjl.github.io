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
    } else {
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

GPSVis.prototype.getGPSData = function() {
    let self = this;
    if (this.selectedEmployee[0] == "All" && this.selectedEmployee[1] == "Employees") {
        return self.gpsData;
    } else {
        let employeeID;
        for (let i = 0; i < self.employeeData.length; i++) {
            if (self.employeeData[i].FirstName == this.selectedEmployee[0] &&
                self.employeeData[i].LastName == this.selectedEmployee[1]) {
                employeeID = self.employeeData[i].CarID;
            } else {
                // Check for triple names like Sten Sanjorge Jr.
                if (this.selectedEmployee.length > 2)
                {
                    let combinedSelectedName = this.selectedEmployee[0] + " " +
                                               this.selectedEmployee[1] + " " +
                                               this.selectedEmployee[2];
                    let combinedDataName = self.employeeData[i].FirstName + " " +
                                           self.employeeData[i].LastName;
                    if (combinedSelectedName == combinedDataName)
                    {
                        employeeID = self.employeeData[i].CarID;
                    }
                }
            }
        }

        let employeeGPS = self.gpsData.filter(filterGPS);
        function filterGPS(value) {
            return value.id == employeeID;
        }
        return employeeGPS;
    }
}

GPSVis.prototype.getGPSDataByDateTime = function(fromDate, toDate, startTime, endTime) {
    // Return empty when given invalid data.
    if (fromDate == null ||
        toDate == null ||
        startTime == null ||
        endTime == null)
    {
        return [];
    }

    let self = this;
    console.log("GPSVis: querying datetime range...");
    startTime.setDate(fromDate.getDate());
    startTime.setMonth(fromDate.getMonth());
    startTime.setYear(fromDate.getFullYear());
    endTime.setDate(toDate.getDate());
    endTime.setMonth(toDate.getMonth());
    endTime.setYear(toDate.getFullYear());
    console.log(startTime);
    console.log(endTime);

    // Allow any times to be compared as long as the end time is further out.
    if (startTime.valueOf() > endTime.valueOf())
    {
        return [];
    }

    let employeeGPSData = self.getGPSData();
    let timeRelevantGPSData = employeeGPSData.filter(filterGPSByDateTime);
    function filterGPSByDateTime(value) {
        // Convert the line data to a date
        const itemDateTime = new Date(value.Timestamp);
        // Verify line between startTime and endTime.
        return (itemDateTime.valueOf() >= startTime.valueOf() &&
            itemDateTime.valueOf() <= endTime.valueOf());
    }
    return timeRelevantGPSData;
}