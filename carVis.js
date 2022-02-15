function CarVis(carData) { // insert object instances into the parameters
    let self = this;

    self.carData = carData;
    self.init();
};

CarVis.prototype.init = function () {
    let self = this;

    // do stuff
}

CarVis.prototype.update = function() {
    let self = this;
    console.log(self.carData);
}