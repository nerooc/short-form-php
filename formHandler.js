let currentUser = "Guest";
let tableCount = 1;
const answerTable = document.querySelector(".table__body");
let formIndexedDB;
let allAnswersArray = [];

///* GRAFY */////////////////////////////////////////////////////////
function drawGraphs() {
  let count = {
    Q1: {
      A: 0,
      B: 0,
      C: 0,
    },
    Q2: {
      A: 0,
      B: 0,
      C: 0,
    },
    Q3: {
      A: 0,
      B: 0,
      C: 0,
    },
  };

  allAnswersArray.forEach((answer) => {
    for (let question in answer) {
      switch (answer[question]) {
        case "A":
          count[question].A++;
          break;
        case "B":
          count[question].B++;
          break;
        case "C":
          count[question].C++;
          break;
      }
    }
  });

  [1, 2, 3].forEach((number) => {
    let ctx = document.querySelector(".graph" + number).getContext("2d");

    // Czyscimy aktualny stan wykresu
    ctx.clearRect(0, 0, ctx.width, ctx.height);

    const graph = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["A", "B", "C"],
        datasets: [
          {
            label: "Count",
            data: [
              count["Q" + number].A,
              count["Q" + number].B,
              count["Q" + number].C,
            ],
            backgroundColor: ["#05386B", "#05386B", "#05386B"],
          },
        ],
      },
      options: {
        scales: {
          yAxes: [
            {
              ticks: {
                beginAtZero: true,
              },
            },
          ],
        },
      },
    });
  });
}

async function insertIndexedDBtoBE() {
  const data = await getAnswersIndexedDB();
  if (data && data.length > 0) {
    await Promise.all(data.map((answer) => insertAnswersBE(answer)));
  }

  answersBE = await getAnswersBE();

  clearTable();

  answersBE.forEach((answer) => {
    createTableEntry(answer);
  });

  allAnswersArray = [...answersBE];

  drawGraphs();

  alert(
    "Internet wrócił - dane z IndexedDB zostały zapisane na serwerze, możesz korzystać ze strony w trybie online."
  );
}

// Funkcja przesylajaca dane zachowane w bazie IndexedDB do backend'u
async function insertBEToIndexedDB() {
  const objectStore = formIndexedDB
    .transaction("answers", "readwrite")
    .objectStore("answers");
  objectStore.clear().onsuccess = () => {
    alert("Brak internetu - możesz korzystać ze strony w trybie offline.");
  };
}

// Funkcje obslugujace dane z backend'u (PHP i MongoDB)
async function getAnswersBE() {
  try {
    const options = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    };

    const response = await fetch(
      "http://pascal.fis.agh.edu.pl/~8gajda/proj2/rest/getAnswers",
      options
    );

    return response.json();
  } catch (e) {
    alert("Error while making request!");
    console.error(e);
  }
}

async function insertAnswersBE(answers) {
  try {
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    };

    options.body = JSON.stringify(answers);

    const response = await fetch(
      "http://pascal.fis.agh.edu.pl/~8gajda/proj2/rest/postAnswer",
      options
    );

    return response.json();
  } catch (e) {
    alert("Error while making request!");
    console.error(e);
  }
}

function getAnswersIndexedDB() {
  return new Promise((resolve, reject) => {
    const objectStore = formIndexedDB
      .transaction("answers")
      .objectStore("answers");
    objectStore.getAll().onsuccess = (e) => {
      resolve(e.target.result);
    };
    objectStore.getAll().onerror = (e) => {
      reject(e);
    };
  });
}

function insertAnswersIndexedDB(answers) {
  return new Promise((resolve, reject) => {
    const objectStore = formIndexedDB
      .transaction("answers", "readwrite")
      .objectStore("answers");
    const request = objectStore.add(answers);
    request.onsuccess = () => {
      resolve(answers);
    };
    request.onerror = (e) => {
      reject(e);
    };
  });
}

///* TABLE */////////////////////////////////////////////////////////

function createTableEntry(answers) {
  const tableEntry = `
    <tr class="table__body__row">
      <th scope="row">${tableCount}</th>
      <td>${answers.email}</td>
      <td>${answers.Q1}</td>
      <td>${answers.Q2}</td>
      <td>${answers.Q3}</td>
    </tr>
  `;

  tableCount++;
  answerTable.insertAdjacentHTML("beforeend", tableEntry);
}

function clearTable() {
  answerTable.innerHTML = "";
}

/* DOBRA FUNKCJA */
async function handleSubmit(e) {
  e.preventDefault();

  let countValid = 0;
  let answersObj = {};
  const questions = document.querySelectorAll(".quiz-form__question");
  questions.forEach((question, idx) => {
    const answers = question.querySelectorAll(".quiz-form__answer input");
    answers.forEach((answer) => {
      if (answer.checked) {
        countValid++;
        answersObj["Q" + (idx + 1)] = answer.value;
      }
    });
  });

  answersObj["email"] = currentUser;
  // PO SUBMIT MAMY WYPELNIONA TABLICE answersObj GDZIE ZAWARTE SA ODPOWIEDZI

  if (countValid < 3) {
    alert("Odpowiedz na wszystkie pytania!");
    return;
  }

  if (navigator.onLine) {
    let x = await insertAnswersBE(answersObj);
    answersObj = x.answer;
  } else {
    await insertAnswersIndexedDB(answersObj);
  }

  allAnswersArray.push(answersObj);
  createTableEntry(answersObj);
  drawGraphs();
}

///* LOGIN */////////////////////////////////////////////////////////

async function handleLogin(e) {
  e.preventDefault();

  if (navigator.onLine) {
    try {
      const email = document.getElementById("login-email").value;
      const password = document.getElementById("login-password").value;

      if (!email || email.length < 5) {
        alert("Email musi mieć conajmniej 5 znaków");
        return;
      }

      if (!password || password.length < 4) {
        alert("Hasło musi mieć przynajmniej 4 znaki");
        return;
      }

      const { result } = await login(email, password);
      currentUser = result.email;

      alert("Zostales zalogowany/a!");

      allAnswersArray = await getAnswersBE();

      allAnswersArray.forEach((temperatureData) => {
        createTableEntry(temperatureData);
      });
      drawGraphs();
    } catch (e) {
      alert("Coś nie tak z podanymi danymi! Spróbuj ponownie!");
    }
  } else {
    alert("Nie można zalogowac - brak dostępu do internetu!");
  }
}

async function handleRegister(e) {
  e.preventDefault();

  try {
    if (navigator.onLine) {
      const email = document.getElementById("register-email").value;
      const password = document.getElementById("register-password").value;

      if (!email || email.length < 5) {
        alert("Email musi mieć conajmniej 5 znaków");
        return;
      }

      if (!password || password.length < 4) {
        alert("Hasło musi mieć przynajmniej 4 znaki");
        return;
      }

      const response = await register(email, password);

      alert("Zostales zarejestrowany/a! Mozesz sie zalogowac!");
    } else {
      alert("Nie można zalogowac - brak dostępu do internetu!");
    }
  } catch (e) {
    alert("Nie zostales zarejestrowany/a - blad!");
    console.error(e);
  }
}

async function login(email, password) {
  try {
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    };

    options.body = JSON.stringify({
      email,
      password,
    });

    const response = await fetch(
      "http://pascal.fis.agh.edu.pl/~8gajda/proj2/rest/login",
      options
    );

    return response.json();
  } catch (e) {
    alert("Error while making request!");
    console.error(e);
  }
}

async function register(email, password) {
  try {
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    };

    options.body = JSON.stringify({
      email,
      password,
    });

    const response = await fetch(
      "http://pascal.fis.agh.edu.pl/~8gajda/proj2/rest/register",
      options
    );

    return response.json();
  } catch (e) {
    alert("Error while making request!");
    console.error(e);
  }
}

// EVENT LISTENER WYKONUJĄCY FUNKCJĘ PO ZAŁADOWANIU DOM
document.addEventListener("DOMContentLoaded", async () => {
  try {
    await initialize();
  } catch (e) {
    alert("There has been an error!");
    console.error(e);
  }
});

// FUNKCJA INICJALIZUJĄCA
function initialize() {
  return new Promise((resolve, reject) => {
    // Gdy przegladarka przechodzi w tryb online, przesyla dane z IndexedDB do bazy
    window.addEventListener("online", async () => await insertIndexedDBtoBE());

    // Gdy przegladarka przechodzi w tryb offline, przesyla dane z bazy do IndexedDB
    window.addEventListener("offline", async () => await insertBEToIndexedDB());

    const form = document.querySelector(".quiz-form");
    // Po wypelnieniu ankiety i kliknieciu 'SubmitForm' wywolujemy funkcje zajmujaca sie ankieta
    form.addEventListener("submit", async (e) => await handleSubmit(e));

    const loginForm = document.getElementById("login");
    // Po wypelnieniu formularza logowania i kliknieciu 'Log in!' wywolujemy funkcje zajmujaca sie logowaniem
    loginForm.addEventListener("submit", async (e) => await handleLogin(e));

    const registerForm = document.getElementById("register");
    // Po wypelnieniu formularza rejestracji i kliknieciu 'Register!' wywolujemy funkcje zajmujaca sie rejestracja
    registerForm.addEventListener(
      "submit",
      async (e) => await handleRegister(e)
    );

    // Otwieramy dzialanie bazy indexedDB
    const request = indexedDB.open("FormDatabase");

    request.onerror = (e) => {
      reject(e);
    };

    request.onsuccess = async (e) => {
      formIndexedDB = e.target.result;

      formIndexedDB.onerror = (e) => {
        console.error("IndexedDB error: " + e.target.errorCode);
      };

      resolve();
    };

    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      db.createObjectStore("answers", { autoIncrement: true });
    };
  });
}
