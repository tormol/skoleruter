// Class to represent a row in the seat reservations grid
/*function SeatReservation(name, initialMeal) {
    var self = this;
    self.name = name;
    self.meal = ko.observable(initialMeal);
}

// Overall viewmodel for this screen, along with initial state
function ReservationsViewModel() {
    var self = this;

    // Non-editable catalog data - would come from the server
    self.availableMeals = [
        { mealName: "Standard (sandwich)", price: 0 },
        { mealName: "Premium (lobster)", price: 34.95 },
        { mealName: "Ultimate (whole zebra)", price: 290 }
    ];

    // Editable data
    self.seats = ko.observableArray([
        new SeatReservation("Steve", self.availableMeals[0]),
        new SeatReservation("Bert", self.availableMeals[1]),
        new SeatReservation("Jonas", self.availableMeals[2])
    ]);
}*/

window.onload = function() {
  //ko.applyBindings(new ReservationsViewModel()); // This makes Knockout get to work

  var viewModel = {};
  console.log("Outside");
  var data = $.getJSON("data/data.json", function (data) {
      console.log("Inside");
      viewModel = ko.mapping.fromJSON(data);
      ko.applyBindings(viewModel);
   });
   console.log("After");
}
