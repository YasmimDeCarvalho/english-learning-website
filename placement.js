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

        const selectedDate = dateInput.value;

        fetch(`http://localhost:3000/placements/booked?date=${selectedDate}`)
            .then(response => response.json())
            .then(data => {

                timeButtons.forEach(function(item) {

                    item.classList.remove("selected");
                    item.disabled = false;

                    const buttonTime = item.dataset.time;

                    if (data.booked_times.includes(buttonTime)) {
                        item.disabled = true;
                    }

                });

            })
            .catch(error => {
                console.error("Erro ao buscar horários ocupados:", error);
            });

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

// ==============================
// SUBMIT PLACEMENT
// ==============================

const placementForm = document.getElementById("placement-form");

placementForm.addEventListener("submit", async function(event) {

    event.preventDefault();

    const studentName = document.getElementById("student-name").value.trim();
    const studentAge = document.getElementById("student-age").value.trim();
    const parentPhone = document.getElementById("parent-phone").value.trim();

    const placementDate = dateInput.value;
    const placementTime = timeInput.value;


    // Basic validation
    if (!placementDate || !placementTime) {
        alert("Por favor, escolha uma data e um horário.");
        return;
    }


    const placementData = {
        student_name: studentName,
        student_age: Number(studentAge),
        parent_phone: parentPhone,
        placement_date: placementDate,
        placement_time: placementTime
    };


    try {

        const response = await fetch("http://localhost:3000/placements", {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(placementData)
        });


        const data = await response.json();


        if (!response.ok) {
            alert(data.message || "Não foi possível realizar o agendamento.");
            return;
        }

        alert("Nivelamento agendado com sucesso!");

        console.log("Placement criado:", data);

        window.location.href = "index.html";


    } catch (error) {

        console.error("Erro ao enviar placement:", error);

        alert("Não foi possível conectar ao servidor.");

    }

});