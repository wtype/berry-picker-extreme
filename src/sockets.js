const crypto = require('crypto');
const socketIO = require('socket.io');

function getRandomLocation() {
  return {
    x: 0.05 + Math.random() * 0.95,
    y: 0.05 + Math.random() * 0.85,
  };
}

function createID() {
  return `id_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
}

function getRandomEndTime() {
  return Date.now() + (5 + Math.floor(Math.random() * 5)) * 1000;
}

function createAnimal(emoji) {
  return {
    id: createID(),
    emoji,
    location: getRandomLocation(),
    nextLocation: getRandomLocation(),
    endTime: getRandomEndTime(),
  };
}

function createStrawberry(location) {
  return {
    id: createID(),
    location,
  };
}

module.exports = server => {
  const io = socketIO(server);
  const clients = {};
  const gameState = {
    strawberriesCollected: 0,
    animals: ['🐍', '🦙', '🐑', '🦌', '🐿', '🦡', '🦝'].map(createAnimal),
    strawberries: [],
  };

  let hasUpdate = false;
  io.on('connection', socket => {
    console.log('Connected clients', Object.keys(clients).length);
    clients[socket.id] = true;
    let lastCollected = Date.now();
    socket.emit('game-state', gameState);
    socket.on('collect-strawberry', ({ id }) => {
      if (Date.now() - lastCollected < 1000) return;
      const foundIndex = gameState.strawberries.findIndex(
        strawberry => strawberry.id === id
      );
      if (foundIndex !== -1) {
        gameState.strawberries.splice(foundIndex, 1);
        gameState.strawberriesCollected += 1;
        hasUpdate = true;
        lastCollected = Date.now();
      }
    });
    socket.on('disconnect', () => {
      delete clients[socket.id];
    });
  });

  setInterval(() => {
    gameState.animals.forEach(animal => {
      const diff = animal.endTime - Date.now();
      if (diff <= 0) {
        const nextLocation = getRandomLocation();
        gameState.strawberries.push(
          createStrawberry({
            y:
              nextLocation.y > animal.nextLocation.y
                ? animal.nextLocation.y + 0.033
                : animal.nextLocation.y - 0.033,
            x:
              nextLocation.x > animal.nextLocation.x
                ? animal.nextLocation.x + 0.033
                : animal.nextLocation.x - 0.033,
          })
        );
        if (gameState.strawberries.length > 40) {
          gameState.strawberries.shift();
        }
        animal.location = animal.nextLocation;
        animal.nextLocation = nextLocation;
        animal.endTime = getRandomEndTime();
        animal.hasUpdate = true;
        hasUpdate = true;
      } else {
        animal.hasUpdate = false;
      }
    });
    if (hasUpdate) {
      io.emit('game-state', gameState);
      hasUpdate = false;
    }
  }, 300);
};
