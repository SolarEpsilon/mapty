'use strict';

/////////////////////////////////////////////////
/////////////////////////////////////////////////
// MAPTY APPLICATION

/////////////////////////////////////////////////
// CLASSES

// Workout class, parent of Cycling and Running classes:
class Workout {
  // Create date variable of the current time:
  date = new Date();
  id = (Date.now() + '').slice(-10);

  // Constructor method runs before anything else in the class and is used to initialize things needed later in the class:
  constructor(coords, distance, duration) {
    this.coords = coords; // [lat, lng]
    this.distance = distance; // In km
    this.duration = duration; // In min
  }

  // Create sidebar description for each activity:
  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    // Description of workout, gotten from the workout data and the current time:
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

// Running class, child of Workout:
class Running extends Workout {
  type = 'running';

  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    // min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

// Cycling class, child of Workout:
class Cycling extends Workout {
  type = 'cycling';

  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    // km/h
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

/////////////////////////////////////////////////
// APPLICATION ARCHITECTURE

// Page Elements:
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

// Huge class containing our entire application:
class App {
  // Protected variables used only inside the class. Defined here so we can use them within different class methods:
  #map;
  #mapZoomLevel = 13;
  #mapEvent;
  #workouts = [];

  constructor() {
    // Get user's position:
    this._getPosition();

    // Get data from local storage:
    this._getLocalStorage();

    // Create buttons:
    this._closeBtn();

    // Attach event handlers:
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }

  // Get user's postion:
  _getPosition() {
    // Make sure geolocation exists (it doesn't in older browsers):
    if (navigator.geolocation)
      // Use JS's "Geolocation.getCurrentPosition", which takes 2 callback functions: a success callback and a failed-to-find-positon callback:
      navigator.geolocation.getCurrentPosition(
        // If user's current postion is found, bind that location to the _loadMap "this" keyword:
        this._loadMap.bind(this),
        // If location is not found, post simple alert:
        function () {
          alert('Could not get your position');
        }
      );
  }

  // Load map:
  _loadMap(position) {
    // Unpack coords from the the "this" keyword in _getPosition:
    const { latitude } = position.coords;
    const { longitude } = position.coords;

    // Create coords with our unpacked lat and long:
    const coords = [latitude, longitude];

    // "L" contains all the Leaflet data on the user's location and other details. From that, we can get the map coords and the zoom level:
    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

    // Use Leafletls "tileLayer" method to display the map, including an attribution link to the map contributors:
    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // Handle clicks on the map:
    this.#map.on('click', this._showForm.bind(this));

    // Log map markers to local storage:
    this.#workouts.forEach(work => {
      this._renderWorkoutMarker(work);
    });
  }

  // Display the new workout form:
  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  // Hide the new workout form:
  _hideForm() {
    // Empty inputs:
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';
    // Hide form display:
    form.style.display = 'none';
    form.classList.add('hidden');
    // After one second, ready form to be called again:
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  // Switch elevation and cadence, depending on which workout form the user is filling out:
  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  // Render and display new workout:
  _newWorkout(e) {
    // Check if each input in a number:
    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));

    // Check if each input is > 0:
    const allPositive = (...inputs) => inputs.every(inp => inp > 0);

    e.preventDefault();

    // Get universal form data:
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    // If workout running, create running object:
    if (type === 'running') {
      // Get running-specific form data:
      const cadence = +inputCadence.value;

      // Check if data is valid (using isFinite to see if it's a number):
      if (
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert('Inputs have to be positive numbers!');

      // Store our new workout in the "workout" object:
      workout = new Running([lat, lng], distance, duration, cadence);
    }

    // If workout cycling, create cycling object:
    if (type === 'cycling') {
      // Get cycling-specific form data:
      const elevation = +inputElevation.value;

      // Check if data is valid (using isFinite to see if it's a number):
      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration, elevation)
      )
        return alert('Inputs have to be positive numbers!');

      // Store our new workout in the "workout" object:
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    // Add the new "workout" object to "#workouts" array:
    this.#workouts.push(workout);

    // Render workout on map as marker:
    this._renderWorkoutMarker(workout);

    // Render workout on list:
    this._renderWorkout(workout);

    // Hide form & clear input fields:
    this._hideForm();

    // Set local storage to all workouts:
    this._setLocalStorage();
  }

  // Render map markers:
  _renderWorkoutMarker(workout) {
    // Another Leaflet method. "L.Marker" is used to display clickable/draggable icons on the map. We set it to the workout coords, then display it on the map with the specifications and className below:
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      // Set an emoji for the workout popup that is different for cycling or running:
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♀️ ' : '🚴 '} ${workout.description}`
      )
      .openPopup();
  }

  // Render workouts to the DOM:
  _renderWorkout(workout) {
    // Use a template literal (``) to create some HTML content with the classes of the specific workout. This displays the workout on the list, not the map:
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === 'running' ? '🏃‍♀️ ' : '🚴 '
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>`;

    if (workout.type === 'running')
      html += `
        <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
        </div>
        </li>
        `;

    if (workout.type === 'cycling')
      html += ` 
        <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
        </div>
        <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
        </div>
        </li> -->`;

    // Add our HTML to the "form" element:
    form.insertAdjacentHTML('afterend', html);
  }

  // Move view to popup when a workout on the list is clicked:
  _moveToPopup(e) {
    // BUGFIX: When we click on a workout before the map has loaded, we get an error. Easy fix is to use a guard clause:
    if (!this.#map) return;

    // Grab nearest workout and set it to "workoutEl":
    const workoutEl = e.target.closest('.workout');

    // If there is no nearest workout, quit method:
    if (!workoutEl) return;

    // Get workout that matches the nearest element from the workouts array:
    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );

    // Set the map view to the popup with "workout.coords":
    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  // Add our "#workouts" array to local storage:
  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  // Pull our workouts from local storage, setting them to "data":
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));

    // If no data, return:
    if (!data) return;

    // Restore data across multiple page reloads by storing "data" to this.#workouts:
    this.#workouts = data;

    // Restore objects' prototype chain by setting a new array and storing the objects in that:
    const fixedWorkouts = [];

    // 1) Loop over "data" var:
    data.forEach(function (workout) {
      if (workout.type === 'running') {
        // 2) Create new objects using the class based on data from local storage:
        fixedWorkouts.push(
          new Running(
            workout.coords,
            workout.distance,
            workout.duration,
            workout.cadence
          )
        );
      }
      if (workout.type === 'cycling') {
        // 2) Create new objects using the class based on data from local storage:
        fixedWorkouts.push(
          new Cycling(
            workout.coords,
            workout.distance,
            workout.duration,
            workout.elevationGain
          )
        );
      }
    });

    // 3) Set "workouts" to the new classes data that has correct scope chain:
    localStorage.setItem('workouts', JSON.stringify(fixedWorkouts));

    // Re-render the workouts, now with correct scope chain:
    this.#workouts.forEach(work => {
      this._renderWorkout(work);
    });
  }

  // Create "clear workouts" button:
  _closeBtn() {
    const btnHtml = `<button class="close__btn">❌</button>`;
    containerWorkouts.insertAdjacentHTML('afterbegin', btnHtml);

    const close = document.querySelector('.close__btn');
    close.addEventListener('click', function () {
      localStorage.removeItem('workouts');
      location.reload();
    });
  }

  reset() {
    localStorage.removeItem('workouts');
    location.reload(); // "location" is a big obj that contains a lot of methods and properties in the browser. One is the ability to reload the page.
  }
}

// Call "App" class:
const app = new App();
