const socket = io();

const wilderness = document.querySelector('#wilderness');
const score = document.querySelector('.score');

const animalsById = {};
const strawberriesById = {};

function removeStrawberry(strawberry) {
  strawberry.classList.add('shrink');
  strawberry.addEventListener('animationend', () => {
    strawberry.remove();
  });
}

function collectStrawberries(strawberry) {
  return () => {
    socket.emit('collect-strawberry', {
      id: strawberry.id,
    });
    if (strawberriesById[strawberry.id]) {
      removeStrawberry(strawberriesById[strawberry.id]);
      delete strawberriesById[strawberry.id];
    }
  };
}

let firstRun = true;
function updateView(gameState) {
  score.textContent = gameState.strawberriesCollected;
  const strawberryIds = {};
  gameState.strawberries.forEach(strawberry => {
    strawberryIds[strawberry.id] = true;
    if (!strawberriesById[strawberry.id]) {
      const strawberryElement = document.createElement('span');
      strawberryElement.classList.add('emoji');
      strawberryElement.classList.add('strawberry');
      strawberryElement.textContent = '🍓';
      strawberriesById[strawberry.id] = strawberryElement;
      strawberryElement.addEventListener(
        'click',
        collectStrawberries(strawberry)
      );
      wilderness.appendChild(strawberryElement);
    }
    strawberriesById[strawberry.id].style.top = `${strawberry.location.y *
      100}vh`;
    strawberriesById[strawberry.id].style.left = `${strawberry.location.x *
      100}vw`;
  });
  Object.entries(strawberriesById).forEach(([id, strawberry]) => {
    if (!strawberryIds[id]) {
      removeStrawberry(strawberry);
    }
  });
  const animalIds = {};
  gameState.animals.forEach(animal => {
    animalIds[animal.id] = true;
    let animalElement = animalsById[animal.id];
    if (!animalElement) {
      animalElement = document.createElement('span');
      animalElement.classList.add('emoji');
      animalElement.classList.add('animal');
      animalElement.textContent = animal.emoji;
      animalsById[animal.id] = animalElement;
      wilderness.appendChild(animalElement);
    }
    if (animal.hasUpdate || firstRun) {
      animalElement.style.top = `${animal.location.y * 100}vh`;
      animalElement.style.left = `${animal.location.x * 100}vw`;
      const duration = (animal.endTime - Date.now()) / 1000;
      animalElement.style.transition = `all ${duration}s ease-in-out`;
      const bounceDuration = 250 + Math.floor(Math.random() * 200);
      let animationName = 'bounce';
      if (animal.nextLocation.x > animal.location.x) {
        animationName = 'flip-bounce';
      }
      animalElement.style.animation = `${animationName} ${bounceDuration}ms alternate ease-in-out infinite`;
      setTimeout(() => {
        animalElement.style.top = `${animal.nextLocation.y * 100}vh`;
        animalElement.style.left = `${animal.nextLocation.x * 100}vw`;
      }, 200);
    }
  });
  Object.entries(animalsById).forEach(([id, animal]) => {
    if (!animalIds[id]) {
      animal.remove();
    }
  });
  firstRun = false;
}

socket.on('game-state', updateView);
