const datesContainer = document.getElementById("available-dates");
const timeSection = document.getElementById("time-section");

const dateInput = document.getElementById("placement-date");
const timeInput = document.getElementById("placement-time");

const timeButtons = document.querySelectorAll(".time-option");


// ==============================
// FIND NEXT SATURDAYS
// ==============================

function getNextSaturdays(amount) {

    const saturdays = [];

    const date = new Date();

    date.setHours(12, 0, 0, 0);

    while (saturdays.length < amount) {

        if (date.getDay() === 6) {
            saturdays.push(new Date(date));
        }

        date.setDate(date.getDate() + 1);
    }

    return saturdays;
}


// ==============================
// DISPLAY DATES
// ==============================

const availableSaturdays = getNextSaturdays(4);

availableSaturdays.forEach(function(date) {

    const button = document.createElement("button");

    button.type = "button";
    button.classList.add("date-option");

    const formattedDate = date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short"
    });

    button.textContent = formattedDate;

    button.addEventListener("click", function() {

        document.querySelectorAll(".date-option").forEach(function(item) {
            item.classList.remove("selected");
        });

        button.classList.add("selected");

        dateInput.value = date.toISOString().split("T")[0];

        timeSection.classList.remove("hidden");

        timeButtons.forEach(function(item) {
            item.classList.remove("selected");
        });

        timeInput.value = "";
    });

    datesContainer.appendChild(button);
});


// ==============================
// SELECT TIME
// ==============================

timeButtons.forEach(function(button) {

    button.addEventListener("click", function() {

        timeButtons.forEach(function(item) {
            item.classList.remove("selected");
        });

        button.classList.add("selected");

        timeInput.value = button.dataset.time;

    });

});