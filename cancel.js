const cancellationReason = document.getElementById("cancellation-reason");
const cancelBookingBtn = document.getElementById("cancel-booking-btn");
const API_URL = "http://localhost:3000";

const studentName = document.getElementById("student-name");
const placementDate = document.getElementById("placement-date");
const placementTime = document.getElementById("placement-time");
const cancellationArea = document.getElementById("cancellation-area");
const bookingMessage = document.getElementById("booking-message");


// ==============================
// GET TOKEN FROM URL
// ==============================

const params = new URLSearchParams(window.location.search);
const token = params.get("token");


// ==============================
// FORMAT DATE
// ==============================

function formatDate(dateString) {
    const dateOnly = dateString.split("T")[0];

    const [year, month, day] = dateOnly.split("-");

    return new Intl.DateTimeFormat("pt-BR", {
        day: "numeric",
        month: "long",
        year: "numeric"
    }).format(
        new Date(
            Number(year),
            Number(month) - 1,
            Number(day)
        )
    );
}


// ==============================
// LOAD BOOKING
// ==============================

async function loadBooking() {

    if (!token) {
        studentName.textContent = "—";
        bookingMessage.textContent =
            "Link de agendamento inválido.";

        cancellationArea.style.display = "none";
        return;
    }

    try {

        const response = await fetch(
            `${API_URL}/placements/manage/${token}`
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message);
        }

        studentName.textContent = data.student_name;
        placementDate.textContent = formatDate(data.placement_date);
        placementTime.textContent = data.placement_time;

        if (data.status === "cancelled") {
            bookingMessage.textContent =
                "Este agendamento já foi cancelado.";

            cancellationArea.style.display = "none";
        }

    } catch (error) {

        console.error(error);

        studentName.textContent = "—";
        placementDate.textContent = "—";
        placementTime.textContent = "—";

        bookingMessage.textContent =
            "Não foi possível encontrar este agendamento.";

        cancellationArea.style.display = "none";
    }
}

// ==============================
// CANCEL BOOKING
// ==============================

cancelBookingBtn.addEventListener("click", async () => {
    try {

        cancelBookingBtn.disabled = true;
        cancelBookingBtn.textContent = "Cancelando...";

        const response = await fetch(
            `${API_URL}/placements/cancel/${token}`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    cancellation_reason: cancellationReason.value.trim()
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message);
        }

        cancellationArea.style.display = "none";

        bookingMessage.textContent =
            "Agendamento cancelado com sucesso.";

    } catch (error) {

        console.error(error);

        bookingMessage.textContent =
            "Não foi possível cancelar o agendamento.";

        cancelBookingBtn.disabled = false;
        cancelBookingBtn.textContent = "Cancelar agendamento";
    }
});


loadBooking();


