const studentForm = document.getElementById("student-info");
const testIntro = document.getElementById("test-intro");
const questionScreen = document.getElementById("question-screen");

studentForm.addEventListener("submit", function (event) {

    event.preventDefault();

    testIntro.classList.add("hidden");
    questionScreen.classList.remove("hidden");

});