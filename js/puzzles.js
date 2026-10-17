const G = (() => {
  let R = Math.random;
  const setRng = f => { R = f; };
  const ri = (a, b) => a + Math.floor(R() * (b - a + 1));
  const pick = a => a[Math.floor(R() * a.length)];
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  let seq = 0;

  // ---------- item assembly ----------
  function mk(o) {
    // o: {sub, stim, correct:{html,key}, wrong:[{html,key}x3], prompt, explain, bankId}
    const all = [{ ...o.correct, ok: true }, ...o.wrong.map(w => ({ ...w, ok: false }))];
    const sh = shuffle(all);
    return {
      id: o.sub + '-' + (++seq), sub: o.sub, stim: o.stim, prompt: o.prompt, explain: o.explain,
      choices: sh.map(c => c.html), keys: sh.map(c => c.key), answer: sh.findIndex(c => c.ok),
      bankId: o.bankId || null, kind: o.kind || 'pic'
    };
  }
  function fillWrong(correctKey, cands, need, extraGen) {
    const out = [], seen = new Set([correctKey]);
    for (const c of cands) { if (out.length >= need) break; if (c && !seen.has(c.key)) { seen.add(c.key); out.push(c); } }
    let guard = 0;
    while (out.length < need && extraGen && guard++ < 200) { const c = extraGen(); if (c && !seen.has(c.key)) { seen.add(c.key); out.push(c); } }
    return out.length === need ? out : null;
  }
  const emo = e => ({ html: `<span class="emo">${e}</span>`, key: e });
  const matrix = cells => `<div class="mx">${cells.map(c => `<div class="mxc">${c}</div>`).join('')}<div class="mxc qbox"><span class="qm">?</span></div></div>`;
  const rowBox = cells => `<div class="rowbox">${cells.map(c => `<div class="rbc">${c}</div>`).join('')}</div>`;

  // ---------- VERBAL BANKS ----------
  const PA = [
    { a: '🌱', b: '🌳', c: '🐛', ans: '🦋', d: ['🐜', '🐞', '🌸'], why: 'A little sprout grows up into a tree. A caterpillar grows up into a butterfly.', lvl: 1 },
    { a: '🐄', b: '🥛', c: '🐔', ans: '🥚', d: ['🧀', '🌽', '🍞'], why: 'A cow gives us milk. A hen gives us eggs.', lvl: 0 },
    { a: '🐠', b: '🌊', c: '🐫', ans: '🏜️', d: ['🌲', '❄️', '🏠'], why: 'A fish lives in the water. A camel lives in the desert.', lvl: 1 },
    { a: '🧦', b: '🦶', c: '🧤', ans: '✋', d: ['👂', '🧣', '👁️'], why: 'A sock goes on your foot. A glove goes on your hand.', lvl: 0 },
    { a: '☔', b: '🌧️', c: '🕶️', ans: '☀️', d: ['❄️', '🌈', '🌙'], why: 'You use an umbrella when it rains. You use sunglasses when it is sunny.', lvl: 1 },
    { a: '🚗', b: '🛣️', c: '🚢', ans: '🌊', d: ['☁️', '🛤️', '🏔️'], why: 'A car travels on a road. A ship travels on the sea.', lvl: 1 },
    { a: '🐱', b: '🦁', c: '🐶', ans: '🐺', d: ['🐻', '🐴', '🐭'], why: 'A lion is a big wild cat. A wolf is a big wild dog.', lvl: 2 },
    { a: '🧑‍🍳', b: '🍳', c: '🧑‍🌾', ans: '🚜', d: ['🚑', '🎸', '✈️'], why: 'A cook uses a pan to do the job. A farmer uses a tractor.', lvl: 1 },
    { a: '🌽', b: '🍿', c: '🥔', ans: '🍟', d: ['🍕', '🍩', '🥕'], why: 'Popcorn is made from corn. French fries are made from potatoes.', lvl: 2 },
    { a: '⬆️', b: '⬇️', c: '⬅️', ans: '➡️', d: ['⬆️', '⬇️', '↕️'], why: 'Up and down point opposite ways. The opposite of left is right.', lvl: 2 },
    { a: '🐿️', b: '🌰', c: '🐒', ans: '🍌', d: ['🦴', '🧀', '🐟'], why: 'A squirrel eats nuts. A monkey eats bananas.', lvl: 0 },
    { a: '🧑‍⚕️', b: '🏥', c: '🧑‍🏫', ans: '🏫', d: ['🏠', '🏪', '🏭'], why: 'A doctor works at a hospital. A teacher works at a school.', lvl: 1 },
    { a: '🐑', b: '🧶', c: '🐝', ans: '🍯', d: ['🌸', '🐞', '🥛'], why: 'Wool yarn comes from sheep. Honey comes from bees.', lvl: 2 },
    { a: '🧣', b: '⛄', c: '🩳', ans: '🏖️', d: ['❄️', '🍂', '🌧️'], why: 'You wear a scarf when it is snowy. You wear shorts at the beach.', lvl: 2 },
    { a: '✏️', b: '📝', c: '🖌️', ans: '🎨', d: ['🔨', '📏', '🧽'], why: 'A pencil is used for writing. A paintbrush is used for painting.', lvl: 2 },
    { a: '🥚', b: '🐣', c: '🌰', ans: '🌳', d: ['🍂', '🐿️', '🍄'], why: 'A chick grows from an egg. An oak tree grows from an acorn.', lvl: 1 },
    // ---- added October 2026 ----
    { a: '🕷️', b: '🕸️', c: '🐦', ans: '🪺', d: ['🌳', '🐛', '☁️'], why: 'A spider makes a web to live in. A bird makes a nest to live in.', lvl: 1 },
    { a: '🪥', b: '🦷', c: '🧽', ans: '🍽️', d: ['🍞', '🧸', '🌳'], why: 'A toothbrush cleans your teeth. A sponge cleans dishes.', lvl: 1 },
    { a: '👓', b: '👀', c: '🎧', ans: '👂', d: ['🎵', '👄', '📺'], why: 'Glasses go over your eyes. Headphones go over your ears.', lvl: 1 },
    { a: '🪵', b: '🪑', c: '🧱', ans: '🏠', d: ['🔨', '🌳', '🧸'], why: 'A chair can be made from wood. A house can be made from bricks.', lvl: 2 },
    { a: '🚒', b: '🧑‍🚒', c: '🚑', ans: '🧑‍⚕️', d: ['🧑‍🚀', '🧑‍🌾', '🧑‍🍳'], why: 'A firefighter works on a fire truck. A medical worker, who helps sick and hurt people, works on an ambulance.', lvl: 1 },
    { a: '🥥', b: '🌴', c: '🍎', ans: '🌳', d: ['🍐', '🌵', '🧺'], why: 'A coconut grows on a palm tree. An apple grows on an apple tree.', lvl: 1 },
    { a: '😀', b: '😢', c: '🔥', ans: '🧊', d: ['🌶️', '☀️', '🕯️'], why: 'Happy is the opposite of sad. Hot fire is the opposite of cold ice.', lvl: 2 },
    { a: '🐻', b: '🍯', c: '🐔', ans: '🌽', d: ['🥚', '🍖', '🍩'], why: 'A bear eats honey. A hen eats corn. A hen lays eggs, but eggs are not its food.', lvl: 2 },
    { a: '✈️', b: '🧑‍✈️', c: '🚀', ans: '🧑‍🚀', d: ['🌙', '🧑‍🚒', '⭐'], why: 'A pilot flies an airplane. An astronaut flies in a rocket.', lvl: 1 },
    { a: '🌳', b: '🍃', c: '🐦', ans: '🪶', d: ['🪺', '🥚', '🐛'], why: 'A leaf is one part of a tree. A feather is one part of a bird.', lvl: 2 },
    { a: '🛶', b: '🚢', c: '🚗', ans: '🚌', d: ['🛣️', '🚲', '⛽'], why: 'A canoe and a ship both go on water, but a ship is much bigger and carries many people. A car and a bus both go on roads, but a bus is much bigger and carries many people.', lvl: 2 },
    { a: '👀', b: '🌈', c: '👂', ans: '🔔', d: ['👄', '🍰', '🧤'], why: 'You see a rainbow with your eyes. You hear a bell with your ears.', lvl: 1 },
    { a: '🎿', b: '❄️', c: '⛸️', ans: '🧊', d: ['⛄', '🏒', '🌊'], why: 'Skis slide on snow. Ice skates slide on ice.', lvl: 2 },
    { a: '🧑‍🎨', b: '🎨', c: '🧑‍🔬', ans: '🔬', d: ['🖌️', '🍳', '🎸'], why: 'An artist works with paints. A scientist works with a microscope.', lvl: 1 },
    { a: '🧊', b: '🥶', c: '🔥', ans: '🥵', d: ['🥶', '😴', '😃'], why: 'Ice makes you feel cold. Fire makes you feel hot.', lvl: 0 },
    { a: '🐘', b: '🐭', c: '🌳', ans: '🌱', d: ['🌲', '🍎', '🌴'], why: 'An elephant is big and a mouse is small. A tree is big and a sprout is small.', lvl: 1 },
    { a: '🌊', b: '🏄', c: '❄️', ans: '🏂', d: ['⛄', '🏊', '🧤'], why: 'A surfer rides on ocean waves. A snowboarder rides on snow.', lvl: 2 },
    { a: '📖', b: '📕', c: '🔓', ans: '🔒', d: ['🔑', '🗝️', '🚪'], why: 'The book goes from open to closed. The lock goes from open to closed.', lvl: 2 },
    { a: '✂️', b: '📄', c: '🪚', ans: '🪵', d: ['🔨', '📄', '🧵'], why: 'Scissors cut paper. A saw cuts wood.', lvl: 2 },
    { a: '🔦', b: '🔋', c: '🚗', ans: '⛽', d: ['🛣️', '🚦', '🧽'], why: 'A flashlight needs a battery to work. This car needs gas to go.', lvl: 2 },
    { a: '🥣', b: '🥄', c: '🍝', ans: '🍴', d: ['🧂', '🍅', '🥤'], why: 'You eat soup with a spoon. You eat spaghetti with a fork.', lvl: 1 },
    { a: '🦉', b: '🌙', c: '🐓', ans: '🌅', d: ['🥚', '🌽', '🌙'], why: 'An owl is awake at night. A rooster crows in the morning, when the sun comes up.', lvl: 2 },
    { a: '🧑‍🔧', b: '🚗', c: '🧑‍⚕️', ans: '🤒', d: ['🏥', '🚑', '💊'], why: 'A mechanic helps a car that is broken. A doctor helps a person who is sick.', lvl: 2 },
    { a: '🐢', b: '🐇', c: '🚶', ans: '🏃', d: ['🧍', '🐌', '🛌'], why: 'A turtle is slow and a rabbit is fast. Walking is slow and running is fast.', lvl: 2 },
    { a: '🪶', b: '🪨', c: '🎈', ans: '🧱', d: ['🎀', '🪁', '☁️'], why: 'A feather is light and a rock is heavy. A balloon is light and a brick is heavy.', lvl: 2 },
    { a: '🐸', b: '🪰', c: '🐦', ans: '🪱', d: ['🪺', '🪶', '🌳'], why: 'A frog catches flies to eat. A bird catches worms to eat.', lvl: 2 },
    { a: '🍎', b: '🍌', c: '🥕', ans: '🥦', d: ['🍐', '🍒', '🍞'], why: 'An apple and a banana are both fruits. A carrot and broccoli are both vegetables.', lvl: 2 },
    { a: '👶', b: '🧔', c: '🐣', ans: '🐔', d: ['🥚', '🐤', '🦆'], why: 'A baby grows up into a grown-up. A chick grows up into a hen.', lvl: 1 },
    { a: '🛏️', b: '😴', c: '🍽️', ans: '😋', d: ['😴', '😢', '🥶'], why: 'You sleep in a bed. You eat from a plate.', lvl: 1 },
    { a: '🍊', b: '⚽', c: '📦', ans: '🎲', d: ['🍩', '🏀', '🍕'], why: 'An orange and a ball are both round. A box and a die are both shaped like cubes, with square sides.', lvl: 2 },
  ];
  const PA_PRACTICE = [
    { a: '🐶', b: '🦴', c: '🐱', ans: '🐟', d: ['🥕', '🎈', '🚗'], why: 'A dog likes to eat a bone. A cat likes to eat fish.' },
    { a: '🐭', b: '🧀', c: '🐰', ans: '🥕', d: ['🍩', '⚽', '🎩'], why: 'A mouse eats cheese. A rabbit eats carrots.' },
  ];
  const SC = [
    { q: 'Which one would you use to cut paper?', ans: '✂️', d: ['🥄', '🔑', '🖍️'], why: 'Scissors cut paper.', lvl: 0 },
    { q: 'Which animal lays eggs but cannot fly?', ans: '🐧', d: ['🦅', '🐶', '🐄'], why: 'A penguin is a bird that lays eggs, but it cannot fly. The eagle can fly.', lvl: 2 },
    { q: 'Which one is the heaviest?', ans: '🐘', d: ['🐭', '🐦', '🐱'], why: 'An elephant is much heavier than the others.', lvl: 0 },
    { q: 'Which one grows under the ground?', ans: '🥕', d: ['🍎', '🍌', '🍒'], why: 'Carrots grow under the ground. The others grow on trees or plants above the ground.', lvl: 1 },
    { q: 'Which one tells you what time it is?', ans: '⏰', d: ['📏', '🧭', '🔦'], why: 'A clock tells the time.', lvl: 0 },
    { q: 'Which one would help you find your way in a forest?', ans: '🧭', d: ['⏰', '🎈', '🧸'], why: 'A compass shows which direction to go.', lvl: 1 },
    { q: 'Which one would you use to find out how long something is?', ans: '📏', d: ['⚖️', '⏰', '🌡️'], why: 'A ruler measures how long something is.', lvl: 1 },
    { q: 'Which one shows how hot or cold it is?', ans: '🌡️', d: ['📏', '⏰', '🧭'], why: 'A thermometer shows how hot or cold it is.', lvl: 1 },
    { q: 'Which one would help you see stars that are very far away?', ans: '🔭', d: ['🔍', '🎧', '🔦'], why: 'A telescope helps you see things that are far away. A magnifying glass is for tiny things close up.', lvl: 2 },
    { q: 'It is dark in the tent. Which one will help Ben read his book?', ans: '🔦', d: ['🕶️', '🎈', '🧦'], why: 'A flashlight makes light so Ben can see.', lvl: 0 },
    { q: 'Which one comes from a tree?', ans: '🍎', d: ['🥚', '🥛', '🧀'], why: 'Apples grow on trees. Eggs, milk and cheese come from animals.', lvl: 1 },
    { q: 'Which one would sink to the bottom of a bathtub?', ans: '🔑', d: ['🦆', '🎈', '🏐'], why: 'A metal key is heavy and sinks. The duck, balloon and beach ball all float.', lvl: 2 },
    { q: 'Which one would melt on a hot, sunny day?', ans: '⛄', d: ['🧱', '🔑', '🎸'], why: 'A snowman is made of snow, and snow melts when it is warm.', lvl: 1 },
    { q: 'Which one has wheels but no motor?', ans: '🚲', d: ['🚗', '🚌', '✈️'], why: 'A bike has wheels, but you pedal it. The others have motors.', lvl: 2 },
    { q: 'Which one is round and you can eat it?', ans: '🍊', d: ['⚽', '🍌', '📦'], why: 'An orange is round and you can eat it. A ball is round, but you cannot eat it.', lvl: 1 },
    { q: 'Which one is bigger than a dog but smaller than an elephant?', ans: '🐴', d: ['🐭', '🐋', '🐜'], why: 'A horse is bigger than a dog and smaller than an elephant. A whale is bigger than an elephant.', lvl: 2 },
    { q: 'Which one belongs in the kitchen, not the bathroom?', ans: '🍳', d: ['🛁', '🪥', '🚽'], why: 'A frying pan belongs in the kitchen.', lvl: 1 },
    { q: 'Which one do you see in the sky at night?', ans: '🌙', d: ['☀️', '🌈', '🦋'], why: 'The moon is in the sky at night.', lvl: 0 },
    { q: 'Which animal lives in the ocean?', ans: '🐙', d: ['🐿️', '🐄', '🦊'], why: 'An octopus lives in the ocean.', lvl: 0 },
    { q: 'Maya is very thirsty after soccer. Which one should she pick?', ans: '🥤', d: ['🍪', '🧸', '⚽'], why: 'A drink helps when you are thirsty.', lvl: 0 },
    { q: 'Which one is NOT a fruit?', ans: '🥕', d: ['🍎', '🍐', '🍇'], why: 'A carrot is a vegetable. The others are fruits. Listen for the word NOT!', lvl: 2 },
    { q: 'Which one helps you see tiny things up close?', ans: '🔬', d: ['🔭', '🎧', '📻'], why: 'A microscope makes tiny things look big. A telescope is for things far away.', lvl: 2 },
    // ---- added October 2026 ----
    { q: 'Which one do you wear on your feet?', ans: '👟', d: ['🧢', '🧤', '👓'], why: 'You wear sneakers on your feet.', lvl: 0 },
    { q: 'Which animal has a very long neck?', ans: '🦒', d: ['🐘', '🐢', '🐷'], why: 'A giraffe has a very long neck.', lvl: 0 },
    { q: 'Which one would you use to sweep the floor?', ans: '🧹', d: ['🪣', '🔨', '🧺'], why: 'You sweep the floor with a broom.', lvl: 1 },
    { q: 'Which one could you use to call a friend?', ans: '📱', d: ['📺', '📷', '📻'], why: 'You can call someone on a phone. A TV, a camera, and a radio cannot make calls.', lvl: 1 },
    { q: 'Which animal can live both in the water and on land?', ans: '🐸', d: ['🐟', '🐦', '🐴'], why: 'A frog can swim in the water and hop on land. A fish has to stay in the water.', lvl: 2 },
    { q: 'Which one is the smallest?', ans: '🐜', d: ['🐕', '🐎', '🐄'], why: 'An ant is much smaller than a dog, a horse, or a cow.', lvl: 0 },
    { q: 'Which one is the lightest, the easiest to lift?', ans: '🪶', d: ['🪨', '🧱', '🛋️'], why: 'A feather is so light you can hardly feel it.', lvl: 1 },
    { q: 'Which one do you need to build a snowman?', ans: '❄️', d: ['🏖️', '🍂', '🔥'], why: 'You build a snowman out of snow.', lvl: 1 },
    { q: 'You are going to build a sandcastle at the beach. Which one should you bring?', ans: '🪣', d: ['⛄', '📚', '🧤'], why: 'A bucket helps you carry and shape the sand.', lvl: 1 },
    { q: 'Which animal has more than four legs?', ans: '🕷️', d: ['🐶', '🐔', '🐱'], why: 'A spider has eight legs. A dog and a cat have four, and a hen has only two.', lvl: 2 },
    { q: 'Which animal has no legs at all?', ans: '🐍', d: ['🐔', '🐜', '🐸'], why: 'A snake has no legs. It slides along on its belly.', lvl: 1 },
    { q: 'Which animal sleeps through most of the winter?', ans: '🐻', d: ['🐶', '🐦', '🐠'], why: 'Many bears sleep through the cold winter in a den.', lvl: 2 },
    { q: 'Which one would you use to wash your hands?', ans: '🧼', d: ['🪥', '🧹', '🔑'], why: 'You wash your hands with soap.', lvl: 0 },
    { q: 'Which one can fly but is NOT a bird?', ans: '🦋', d: ['🦅', '🦉', '🦜'], why: 'A butterfly can fly, but it is an insect, not a bird. Listen for the word NOT!', lvl: 2 },
    { q: 'Which one is hot?', ans: '☕', d: ['🍦', '🧊', '⛄'], why: 'A hot drink in a mug is hot. The others are cold.', lvl: 0 },
    { q: "Sam's ice cream is melting. Which one is making it melt?", ans: '☀️', d: ['❄️', '🌙', '☁️'], why: 'The hot sun melts ice cream.', lvl: 1 },
    { q: 'Which one should go in the refrigerator?', ans: '🥛', d: ['🧦', '📚', '🔨'], why: 'Milk goes in the refrigerator to stay cold and fresh.', lvl: 1 },
    { q: 'Which one is the fastest?', ans: '🚀', d: ['🚲', '🐢', '🐌'], why: 'A rocket is the fastest. It goes much faster than a bike.', lvl: 1 },
    { q: 'Which one can you NOT eat?', ans: '🧱', d: ['🍞', '🍇', '🧀'], why: 'You cannot eat a brick. Listen for the word NOT!', lvl: 2 },
    { q: 'Which person is the youngest?', ans: '👶', d: ['🧔', '👴', '🧑'], why: 'A baby is the youngest. The others are all grown-ups.', lvl: 1 },
    { q: "Ana's plant is dry and droopy. Which one does it need?", ans: '💧', d: ['🔨', '🧦', '🍕'], why: 'Plants need water to grow.', lvl: 1 },
    { q: 'Which one tells cars when to stop and when to go?', ans: '🚦', d: ['⛽', '🛞', '🧭'], why: 'A traffic light turns red for stop and green for go.', lvl: 1 },
    { q: 'Which animal hops instead of walking?', ans: '🦘', d: ['🐘', '🐄', '🐢'], why: 'A kangaroo hops on its strong back legs.', lvl: 1 },
    { q: 'Leo wants to paint a picture. Which one does he need?', ans: '🖌️', d: ['🔨', '🧽', '🥄'], why: 'You paint with a paintbrush.', lvl: 0 },
    { q: 'Which one is NOT something you wear?', ans: '🍳', d: ['👕', '🧢', '🧦'], why: 'A frying pan is for cooking, not for wearing. Listen for the word NOT!', lvl: 2 },
    { q: 'Which animal has feathers AND lays eggs?', ans: '🐔', d: ['🐍', '🐢', '🐄'], why: 'A hen has feathers and lays eggs. A snake and a turtle lay eggs too, but they have no feathers.', lvl: 2 },
    { q: 'Which one is round AND bounces?', ans: '🏀', d: ['🍊', '🧱', '🎲'], why: 'A basketball is round and bounces. An orange is round, but it does not bounce.', lvl: 2 },
    { q: 'Which one is cold AND sweet?', ans: '🍦', d: ['🧊', '🍰', '☕'], why: 'Ice cream is cold and sweet. Ice is cold but not sweet, and cake is sweet but not cold.', lvl: 2 },
    { q: 'Which animal is the slowest?', ans: '🐌', d: ['🐆', '🐇', '🐎'], why: 'A snail moves very, very slowly.', lvl: 1 },
    { q: 'Which animal carries a hard shell on its back?', ans: '🐢', d: ['🐶', '🐸', '🐍'], why: 'A turtle has a hard shell on its back.', lvl: 1 },
    { q: 'Which one can you see through?', ans: '🪟', d: ['🚪', '🧱', '📦'], why: 'You can see through a glass window.', lvl: 2 },
    { q: 'Which one tells you how heavy something is?', ans: '⚖️', d: ['📏', '⏰', '🌡️'], why: 'A scale tells you how heavy something is. A ruler tells you how long it is.', lvl: 2 },
    { q: 'Mia scraped her knee. Which one will help?', ans: '🩹', d: ['🔨', '🧽', '🎈'], why: 'A bandage covers a scrape so it can heal.', lvl: 1 },
    { q: 'Which one is shaped like a triangle?', ans: '🍕', d: ['⚽', '📦', '🍩'], why: 'A slice of pizza is shaped like a triangle.', lvl: 1 },
    { q: 'Which animal has black and white stripes?', ans: '🦓', d: ['🐘', '🐷', '🐑'], why: 'A zebra has black and white stripes.', lvl: 0 },
    { q: 'Which one could carry you across a river?', ans: '🛶', d: ['🚗', '🚲', '🛴'], why: 'A canoe floats, so it can carry you across the water.', lvl: 1 },
    { q: 'Which one grows from a seed?', ans: '🌻', d: ['🪨', '🧸', '🚗'], why: 'A sunflower grows from a seed.', lvl: 1 },
    { q: 'Which one did NOT come from an animal?', ans: '🍎', d: ['🥛', '🥚', '🧀'], why: 'An apple grows on a tree. Milk comes from cows, eggs come from hens, and cheese is made from milk.', lvl: 2 },
  ];
  const SC_PRACTICE = [
    { q: 'Which one do you use to brush your teeth?', ans: '🪥', d: ['🥄', '✂️', '🔑'], why: 'You brush your teeth with a toothbrush.' },
    { q: 'Which animal says moo?', ans: '🐄', d: ['🐶', '🐱', '🐑'], why: 'A cow says moo.' },
  ];
  const PC = [
    { set: ['🐶', '🐴', '🐘'], ans: '🦒', d: ['🐔', '🐧', '🐍'], why: 'They are all animals with four legs. The giraffe has four legs too.', lvl: 1 },
    { set: ['✂️', '🔨', '🔧'], ans: '🪓', d: ['🍕', '🎈', '🧸'], why: 'They are all tools.', lvl: 0 },
    { set: ['🎸', '🥁', '🎺'], ans: '🎻', d: ['🎧', '📻', '🎤'], why: 'They are all instruments you play to make music. Headphones, a radio and a microphone are not instruments.', lvl: 2 },
    { set: ['☀️', '🔥', '💡'], ans: '🕯️', d: ['🌧️', '🧊', '🎈'], why: 'They all give off light.', lvl: 1 },
    { set: ['🧊', '⛄', '❄️'], ans: '🍦', d: ['🔥', '☀️', '☕'], why: 'They are all cold.', lvl: 1 },
    { set: ['🍩', '🍪', '🎂'], ans: '🧁', d: ['🥦', '🥕', '🌽'], why: 'They are all sweet treats.', lvl: 0 },
    { set: ['🦅', '🦋', '🐝'], ans: '🦇', d: ['🐌', '🐢', '🐍'], why: 'They can all fly.', lvl: 1 },
    { set: ['👕', '👖', '🧥'], ans: '🧦', d: ['🛏️', '🧸', '🍎'], why: 'They are all clothes you wear.', lvl: 0 },
    { set: ['🌵', '🌻', '🌳'], ans: '🌷', d: ['🐛', '⚽', '🏠'], why: 'They are all plants.', lvl: 0 },
    { set: ['🐟', '🐙', '🐬'], ans: '🦀', d: ['🐫', '🐿️', '🦉'], why: 'They all live in the water.', lvl: 1 },
    { set: ['⚽', '🏀', '🎾'], ans: '⚾', d: ['🥊', '🎯', '🛹'], why: 'They are all balls.', lvl: 0 },
    { set: ['🍊', '🌕', '⚽'], ans: '🍪', d: ['📦', '📐', '🍌'], why: 'They are all round.', lvl: 2 },
    { set: ['🧀', '🥛', '🍦'], ans: '🧈', d: ['🍞', '🍎', '🥚'], why: 'They are all made from milk.', lvl: 2 },
    { set: ['🚒', '🍓', '🍅'], ans: '🌹', d: ['🍌', '🥦', '🐸'], why: 'They are all red.', lvl: 2 },
    { set: ['🕐', '📅', '⏳'], ans: '⏰', d: ['📏', '⚖️', '🌡️'], why: 'They all help you know about time.', lvl: 2 },
    { set: ['🦆', '🐧', '🦉'], ans: '🦜', d: ['🦇', '🐝', '🐟'], why: 'They are all birds. A bat can fly, but it is not a bird.', lvl: 2 },
    // ---- added October 2026 ----
    { set: ['✈️', '🚁', '🚀'], ans: '🪁', d: ['🚗', '🚢', '🚂'], why: 'They all go up into the sky.', lvl: 1 },
    { set: ['⛵', '🚤', '🛶'], ans: '🚢', d: ['🚗', '🚲', '🚂'], why: 'They all travel on water.', lvl: 0 },
    { set: ['🍳', '🥄', '🫖'], ans: '🍴', d: ['🛏️', '🚿', '🪥'], why: 'You find them all in a kitchen.', lvl: 1 },
    { set: ['🛁', '🪥', '🧼'], ans: '🚽', d: ['🍳', '🛏️', '📺'], why: 'You find them all in a bathroom.', lvl: 1 },
    { set: ['🚲', '🛒', '🚗'], ans: '🛴', d: ['⛵', '🛷', '🛶'], why: 'They all roll on wheels. A sled slides on snow, but it has no wheels.', lvl: 2 },
    { set: ['🍌', '🌻', '🐥'], ans: '🍋', d: ['🍓', '🥦', '🍇'], why: 'They are all yellow.', lvl: 1 },
    { set: ['🥦', '🐸', '🍀'], ans: '🥒', d: ['🍌', '🍅', '🍊'], why: 'They are all green.', lvl: 1 },
    { set: ['🔥', '☀️', '☕'], ans: '🍲', d: ['🍦', '❄️', '🧊'], why: 'They are all hot.', lvl: 1 },
    { set: ['✂️', '🪡', '🌵'], ans: '📌', d: ['🧸', '🧽', '🎈'], why: 'They are all sharp or pointy.', lvl: 2 },
    { set: ['🐢', '🐌', '🦀'], ans: '🦞', d: ['🐟', '🐍', '🐸'], why: 'They all have a hard shell.', lvl: 2 },
    { set: ['🐜', '🐞', '🐝'], ans: '🦗', d: ['🐦', '🐭', '🐠'], why: 'They are all insects, or bugs.', lvl: 1 },
    { set: ['🐄', '🐖', '🐑'], ans: '🐐', d: ['🦁', '🐧', '🐬'], why: 'They are all farm animals.', lvl: 0 },
    { set: ['🦁', '🐯', '🐘'], ans: '🦒', d: ['🐄', '🐶', '🐱'], why: 'They are all wild animals. They do not live on farms or in houses.', lvl: 1 },
    { set: ['✏️', '🖊️', '🖍️'], ans: '🖌️', d: ['🥄', '🔑', '🧽'], why: 'You can draw or write with all of them.', lvl: 1 },
    { set: ['🌧️', '❄️', '🌩️'], ans: '🌪️', d: ['🍎', '🏠', '🚗'], why: 'They are all kinds of weather.', lvl: 1 },
    { set: ['🪣', '🥛', '🛁'], ans: '☕', d: ['🧺', '📄', '🍪'], why: 'They can all hold water. A basket has holes, so water would run out.', lvl: 2 },
    { set: ['🧣', '🧤', '🧥'], ans: '👢', d: ['🩳', '🩱', '🩴'], why: 'You wear all of them when it is cold outside.', lvl: 1 },
    { set: ['🥕', '🥦', '🌽'], ans: '🥬', d: ['🍎', '🍇', '🍓'], why: 'They are all vegetables.', lvl: 1 },
    { set: ['📚', '✏️', '🎒'], ans: '📏', d: ['🛁', '🛏️', '🍳'], why: 'You use them all at school.', lvl: 1 },
    { set: ['🔔', '📣', '🥁'], ans: '⏰', d: ['🪶', '🧸', '🌸'], why: 'They all make loud sounds.', lvl: 2 },
    { set: ['🎒', '👜', '🧳'], ans: '🛍️', d: ['🧢', '👟', '🧦'], why: 'You can carry things in all of them.', lvl: 1 },
    { set: ['💡', '📺', '💻'], ans: '📱', d: ['📖', '🧸', '🪁'], why: 'They all need electricity to work.', lvl: 2 },
    { set: ['🌱', '🌻', '🐣'], ans: '🐶', d: ['🪨', '🧸', '🚗'], why: 'They are all living things that grow. A teddy bear looks like an animal, but it is not alive.', lvl: 2 },
    { set: ['🍊', '🥕', '🦊'], ans: '🏀', d: ['🥦', '🍇', '🍌'], why: 'They are all orange.', lvl: 1 },
    { set: ['⛄', '🥛', '☁️'], ans: '🦢', d: ['🍫', '🐻', '🍓'], why: 'They are all white.', lvl: 1 },
    { set: ['🧸', '🛏️', '🪶'], ans: '🧶', d: ['🪨', '🔨', '🧱'], why: 'They are all soft.', lvl: 1 },
    { set: ['🏠', '⛺', '🏡'], ans: '🛖', d: ['🚗', '🏫', '🏥'], why: 'People live in all of them. People go to a school or a hospital, but they do not live there.', lvl: 2 },
    { set: ['🎂', '🎈', '🎁'], ans: '🎉', d: ['🧹', '🛏️', '🧽'], why: 'You see them all at a party.', lvl: 0 },
    { set: ['🧢', '👒', '🎩'], ans: '👑', d: ['🧦', '👟', '🧤'], why: 'You wear them all on your head.', lvl: 0 },
    { set: ['🐿️', '🦉', '🐒'], ans: '🐨', d: ['🐟', '🐄', '🐪'], why: 'They all live in trees.', lvl: 2 },
    { set: ['⭐', '🌙', '☀️'], ans: '🪐', d: ['🌳', '🏠', '🌊'], why: 'They are all out in space, far above the sky.', lvl: 1 },
    { set: ['🐶', '🐱', '🐹'], ans: '🐠', d: ['🦁', '🐻', '🦈'], why: 'They can all be pets that live in a home.', lvl: 1 },
    { set: ['🥛', '🧃', '☕'], ans: '🥤', d: ['🍞', '🍕', '🍎'], why: 'You drink them all.', lvl: 0 },
    { set: ['🦒', '🌲', '🏢'], ans: '🗼', d: ['🐜', '🍄', '🐭'], why: 'They are all very tall.', lvl: 2 },
    { set: ['🌙', '🦉', '⭐'], ans: '🦇', d: ['☀️', '🌈', '🌅'], why: 'You see all of them at night. You see the sun and a rainbow in the daytime.', lvl: 2 },
  ];
  const PC_PRACTICE = [
    { set: ['🍎', '🍌', '🍇'], ans: '🍐', d: ['🚗', '🧦', '✏️'], why: 'They are all fruits.' },
    { set: ['🚗', '🚌', '🚲'], ans: '🛵', d: ['🐶', '🍎', '🏠'], why: 'They are all things you can ride on.' },
  ];

  function paItem(b, bankId) {
    return mk({ sub: 'pa', bankId, stim: matrix([b.a, b.b, b.c].map(e => `<span class="emo">${e}</span>`)),
      correct: emo(b.ans), wrong: b.d.map(emo), prompt: 'Which picture goes in the empty box?', explain: b.why });
  }
  function scItem(b, bankId) {
    return mk({ sub: 'sc', bankId, stim: `<div class="listen"><span class="listen-ic" aria-hidden="true">🎧</span><p class="listen-q">${b.q}</p></div>`,
      correct: emo(b.ans), wrong: b.d.map(emo), prompt: b.q, explain: b.why });
  }
  function pcItem(b, bankId) {
    return mk({ sub: 'pc', bankId, stim: rowBox(b.set.map(e => `<span class="emo">${e}</span>`)),
      correct: emo(b.ans), wrong: b.d.map(emo), prompt: 'Which picture goes best with the pictures in the top row?', explain: b.why });
  }

  function bankPick(bank, n, seen, level) {
    // prefer unseen, keep difficulty order
    const idx = bank.map((b, i) => i);
    const unseen = shuffle(idx.filter(i => !seen.has(i)));
    const seenL = shuffle(idx.filter(i => seen.has(i)));
    const chosen = unseen.concat(seenL).slice(0, Math.min(n, bank.length));
    chosen.sort((a, b) => bank[a].lvl - bank[b].lvl);
    return chosen;
  }

  // ---------- NUMBER ANALOGIES ----------
  const OBJ = ['🍎', '⭐', '🐞', '⚽', '🌸', '🍪', '🐟', '🎈', '🍓', '🔵'];
  const NR = [
    { id: 'same', f: x => x, t: 'stays the same' },
    ...[1, 2, 3, 4].map(k => ({ id: 'add' + k, f: x => x + k, t: `gets ${k} more` })),
    ...[1, 2, 3, 4].map(k => ({ id: 'sub' + k, f: x => x - k, t: `gets ${k} fewer` })),
    { id: 'dbl', f: x => x * 2, t: 'doubles (becomes twice as many)' },
    { id: 'half', f: x => (x % 2 === 0 ? x / 2 : NaN), t: 'is cut in half' },
  ];
  const NRL = [['same', 'add1', 'add2', 'sub1'], ['add2', 'add3', 'sub2', 'dbl', 'sub1'], ['add3', 'add4', 'sub3', 'sub4', 'half', 'dbl']];
  const valid = x => Number.isInteger(x) && x >= 1 && x <= 10;
  const objs = (e, n) => `<div class="objs n${n}">${Array(n).fill(`<span>${e}</span>`).join('')}</div>`;
  const numCard = n => `<span class="numc">${n}</span>`;
  function naItem(level) {
    for (let t = 0; t < 500; t++) {
      const rid = pick(NRL[level]); const r = NR.find(q => q.id === rid);
      const a = ri(1, 9), b = r.f(a); if (!valid(b)) continue;
      const c = ri(1, 9); if (c === a) continue; const d = r.f(c); if (!valid(d)) continue;
      if (r.id !== 'same' && (a === b)) continue;
      const cons = NR.filter(q => q.f(a) === b);
      if (cons.some(q => q.f(c) !== d)) continue;
      const useNum = level === 2 && R() < 0.4;
      const [X, Y] = shuffle(OBJ).slice(0, 2);
      const Yb = R() < 0.5 ? X : Y;
      const show = (e, n) => (useNum ? numCard(n) : objs(e, n));
      const opt = (e, n) => ({ html: show(e, n), key: (useNum ? '' : e) + ':' + n });
      const cands = [];
      if (!useNum && Yb !== X) cands.push(opt(X, d));
      cands.push(...shuffle([c, d + 1, d - 1, d + 2, d - 2].filter(valid)).map(n => opt(Yb, n)));
      const wrong = fillWrong(opt(Yb, d).key, cands, 3, () => { const n = ri(1, 10); return opt(Yb, n); });
      if (!wrong) continue;
      return mk({ sub: 'na', stim: matrix([show(X, a), show(X, b), show(Yb, c)]), correct: opt(Yb, d), wrong,
        prompt: 'Which answer goes in the empty box?',
        explain: `In the top row, ${a} becomes ${b}: the number ${r.t}. So in the bottom row, ${c} becomes ${d}.` });
    }
  }

  // ---------- NUMBER PUZZLES (Level 8: equations) ----------
  function npItem(level) {
    for (let t = 0; t < 500; t++) {
      let left, right, ans, naive = null, why;
      const q = '<span class="qm">?</span>';
      const ty = level === 0 ? pick(['a+?=c', '?+b=c', 'a+b=?']) : level === 1 ? pick(['a-?=c', '?-b=c', 'a+b=?+d', 'a+?=c']) : pick(['a+b=c+?', 'a+b=c+?', 'a+b-c=?', 'a+?=b+c', '?-b=c+d']);
      if (ty === 'a+?=c') { const a = ri(2, level ? 9 : 6), x = ri(1, level ? 9 : 5); const c = a + x; left = `${a} + ${q}`; right = `${c}`; ans = x; naive = a + c > 20 ? null : c; why = `${a} + ${x} = ${c}.`; }
      if (ty === '?+b=c') { const b = ri(1, 6), x = ri(1, 6); left = `${q} + ${b}`; right = `${x + b}`; ans = x; why = `${x} + ${b} = ${x + b}.`; }
      if (ty === 'a+b=?') { const a = ri(1, 7), b = ri(1, 7); left = `${a} + ${b}`; right = q; ans = a + b; why = `${a} + ${b} = ${a + b}.`; }
      if (ty === 'a-?=c') { const a = ri(5, 12), x = ri(1, a - 1); left = `${a} − ${q}`; right = `${a - x}`; ans = x; naive = a - x; why = `${a} − ${x} = ${a - x}.`; }
      if (ty === '?-b=c') { const b = ri(1, 6), c = ri(1, 8); left = `${q} − ${b}`; right = `${c}`; ans = b + c; naive = c - b > 0 ? c - b : null; why = `${b + c} − ${b} = ${c}.`; }
      if (ty === 'a+b=?+d') { const a = ri(2, 8), b = ri(1, 8), d = ri(1, a + b - 1); left = `${a} + ${b}`; right = `${q} + ${d}`; ans = a + b - d; naive = a + b; why = `${a} + ${b} is ${a + b}. ${ans} + ${d} is also ${a + b}, so both sides match.`; }
      if (ty === 'a+b=c+?') { const a = ri(3, 9), b = ri(2, 9), c = ri(1, a + b - 1); left = `${a} + ${b}`; right = `${c} + ${q}`; ans = a + b - c; naive = a + b; why = `${a} + ${b} is ${a + b}. ${c} + ${ans} is also ${a + b}, so both sides match.`; }
      if (ty === 'a+b-c=?') { const a = ri(3, 9), b = ri(2, 8), c = ri(1, a + b - 1); left = `${a} + ${b} − ${c}`; right = q; ans = a + b - c; naive = a + b; why = `${a} + ${b} is ${a + b}, and ${a + b} − ${c} is ${ans}.`; }
      if (ty === 'a+?=b+c') { const b = ri(2, 8), c = ri(2, 8), a = ri(1, b + c - 1); left = `${a} + ${q}`; right = `${b} + ${c}`; ans = b + c - a; naive = b + c; why = `${b} + ${c} is ${b + c}. ${a} + ${ans} is also ${b + c}.`; }
      if (ty === '?-b=c+d') { const b = ri(1, 5), c = ri(1, 6), d = ri(1, 5); left = `${q} − ${b}`; right = `${c} + ${d}`; ans = c + d + b; naive = c + d; why = `${c} + ${d} is ${c + d}. ${ans} − ${b} is also ${c + d}.`; }
      if (ans < 0 || ans > 20) continue;
      const opt = n => ({ html: numCard(n), key: 'n' + n });
      const cands = []; if (naive !== null && naive !== ans && naive >= 0) cands.push(opt(naive));
      cands.push(...shuffle([ans + 1, ans - 1, ans + 2, ans - 2].filter(n => n >= 0)).map(opt));
      const wrong = fillWrong('n' + ans, cands, 3); if (!wrong) continue;
      return mk({ sub: 'np', kind: 'num', stim: `<div class="eq">${left} <span class="eqs">=</span> ${right}</div>`, correct: opt(ans), wrong,
        prompt: 'Which number makes both sides of the equal sign the same?', explain: why });
    }
  }

  // ---------- NUMBER SERIES (beads) ----------
  function rod(n, max = 10) {
    const h = max * 13 + 24, W = 34; let s = `<svg class="rod" viewBox="0 0 ${W} ${h}" width="${W}" height="${h}" role="img" aria-label="${n} beads"><line x1="${W / 2}" y1="4" x2="${W / 2}" y2="${h - 4}" style="stroke:var(--rod);stroke-width:3;stroke-linecap:round"/>`;
    for (let i = 0; i < n; i++) s += `<circle cx="${W / 2}" cy="${h - 12 - i * 13 - (i >= 5 ? 6 : 0)}" r="6.2" style="fill:var(--bead);stroke:var(--ink);stroke-width:1.2"/>`;
    return s + '</svg>';
  }
  const SP = {
    inc1: () => { const s = ri(1, 4); return { seq: [0, 1, 2, 3, 4, 5].map(i => s + i), why: 'Each string has 1 more bead than the one before.' }; },
    dec1: () => { const s = ri(6, 9); return { seq: [0, 1, 2, 3, 4, 5].map(i => s - i), why: 'Each string has 1 fewer bead than the one before.' }; },
    alt: () => { const a = ri(1, 5), b = a + ri(2, 4); const f = R() < 0.5; const x = f ? a : b, y = f ? b : a; return { seq: [x, y, x, y, x, y], why: `The strings go ${x}, ${y}, ${x}, ${y}... so ${y} comes next.` }; },
    pairs: () => { const s = ri(1, 4); return { seq: [s, s, s + 1, s + 1, s + 2, s + 2], why: 'Each number of beads comes twice, then goes up by 1.' }; },
    inc2: () => { const s = ri(1, 3); return { seq: [0, 1, 2, 3, 4].map(i => s + 2 * i), why: 'Each string has 2 more beads than the one before.' }; },
    dec2: () => { const s = ri(9, 11); return { seq: [0, 1, 2, 3, 4].map(i => s - 2 * i), why: 'Each string has 2 fewer beads than the one before.' }; },
    cycle3: () => { const [a, b, c] = shuffle([1, 2, 3, 4, 5, 6, 7]).slice(0, 3); return { seq: [a, b, c, a, b, c], why: `The pattern ${a}, ${b}, ${c} repeats.` }; },
    updown: () => { const s = ri(1, 4); return { seq: [s, s + 2, s + 1, s + 3, s + 2, s + 4], why: 'The beads go up 2, then down 1, then up 2, then down 1.' }; },
    skip12: () => { const s = ri(1, 2); return { seq: [s, s + 1, s + 3, s + 4, s + 6, s + 7], why: 'The beads go up 1, then up 2, then up 1, then up 2.' }; },
    dec21: () => { const s = ri(9, 10); return { seq: [s, s - 2, s - 3, s - 5, s - 6, s - 8], why: 'The beads go down 2, then down 1, then down 2, then down 1.' }; },
  };
  const SPL = [['inc1', 'dec1', 'alt'], ['pairs', 'inc2', 'dec2', 'cycle3', 'alt'], ['updown', 'skip12', 'dec21', 'cycle3', 'pairs', 'dec2']];
  function nsItem(level) {
    for (let t = 0; t < 300; t++) {
      const p = SP[pick(SPL[level])](); const seq = p.seq; if (seq.length < 4) continue;
      const shown = seq.slice(0, -1), ans = seq[seq.length - 1];
      if (seq.some(x => x < 1 || x > 10)) continue;
      const opt = n => ({ html: rod(n), key: 'r' + n });
      const cands = shuffle([ans + 1, ans - 1, shown[shown.length - 1], ans + 2, ans - 2].filter(n => n >= 1 && n <= 10)).map(opt);
      const wrong = fillWrong('r' + ans, cands, 3); if (!wrong) continue;
      return mk({ sub: 'ns', stim: `<div class="beads">${shown.map(n => `<div class="bslot">${rod(n)}</div>`).join('')}<div class="bslot qslot"><span class="qm">?</span></div></div>`,
        correct: opt(ans), wrong, prompt: 'Which string of beads comes next?', explain: p.why });
    }
  }

  // ---------- FIGURES ----------
  const SHAPES = ['circle', 'square', 'triangle', 'diamond', 'star', 'hexagon', 'cross'];
  const FILLS = ['hollow', 'solid', 'gray', 'striped'];
  const FILLNAME = { hollow: 'white (empty inside)', solid: 'dark (filled in)', gray: 'gray', striped: 'striped' };
  const SHAPENAME = { circle: 'circles', square: 'squares', triangle: 'triangles', diamond: 'diamonds', star: 'stars', hexagon: 'hexagons', cross: 'plus signs', arrow: 'arrows' };
  const fkey = f => [f.shape, f.fill, f.size, f.count, ((f.rot % 360) + 360) % 360, f.dot].join('|');
  function shapeEl(f, cx, cy, r) {
    const P = (pts) => 'M' + pts.map(p => (cx + p[0] * r).toFixed(1) + ' ' + (cy + p[1] * r).toFixed(1)).join('L') + 'Z';
    const reg = (n, off, rr = 1) => Array.from({ length: n }, (_, i) => { const a = (off + i * 360 / n) * Math.PI / 180; return [rr * Math.cos(a), rr * Math.sin(a)]; });
    let d;
    switch (f.shape) {
      case 'circle': d = null; break;
      case 'square': d = P([[-.82, -.82], [.82, -.82], [.82, .82], [-.82, .82]]); break;
      case 'triangle': d = P([[0, -1], [.95, .72], [-.95, .72]]); break;
      case 'diamond': d = P([[0, -1], [.7, 0], [0, 1], [-.7, 0]]); break;
      case 'hexagon': d = P(reg(6, 0)); break;
      case 'star': { const p = []; for (let i = 0; i < 10; i++) { const a = (-90 + i * 36) * Math.PI / 180, rr = i % 2 ? .45 : 1; p.push([rr * Math.cos(a), rr * Math.sin(a)]); } d = P(p); break; }
      case 'cross': d = P([[-.3, -.95], [.3, -.95], [.3, -.3], [.95, -.3], [.95, .3], [.3, .3], [.3, .95], [-.3, .95], [-.3, .3], [-.95, .3], [-.95, -.3], [-.3, -.3]]); break;
      case 'arrow': d = P([[-.95, -.28], [.2, -.28], [.2, -.72], [.98, 0], [.2, .72], [.2, .28], [-.95, .28]]); break;
    }
    const fillStyle = { hollow: 'var(--paper)', solid: 'var(--ink)', gray: 'var(--mid)', striped: 'url(#stripes)' }[f.fill];
    const st = `style="fill:${fillStyle};stroke:var(--ink);stroke-width:2.6;stroke-linejoin:round"`;
    const tr = f.rot ? ` transform="rotate(${f.rot} ${cx} ${cy})"` : '';
    let s = d === null ? `<circle cx="${cx}" cy="${cy}" r="${r * .92}" ${st}/>` : `<path d="${d}" ${st}${tr}/>`;
    if (f.dot) { const dc = f.fill === 'solid' ? 'fill:var(--paper)' : f.fill === 'hollow' ? 'fill:var(--ink)' : 'fill:var(--paper);stroke:var(--ink);stroke-width:2'; s += `<circle cx="${cx}" cy="${cy + (f.shape === 'triangle' ? r * .15 : 0)}" r="${Math.max(3.5, r * .22)}" style="${dc}"/>`; }
    return s;
  }
  function fig(f) {
    const RAD = { 1: { L: 34, S: 17 }, 2: { L: 20, S: 11 }, 3: { L: 17, S: 10 } }[f.count][f.size];
    const pos = { 1: [[50, 50]], 2: [[27, 50], [73, 50]], 3: [[50, 27], [27, 72], [73, 72]] }[f.count];
    return `<svg class="fig" viewBox="0 0 100 100" aria-hidden="true">${pos.map(p => shapeEl(f, p[0], p[1], RAD)).join('')}</svg>`;
  }
  const fopt = f => ({ html: fig(f), key: fkey(f) });
  const baseFig = o => ({ shape: 'circle', fill: 'hollow', size: 'L', count: 1, rot: 0, dot: 0, ...o });

  // FIGURE MATRICES
  const CH = ['fill', 'size', 'count', 'rot', 'dot'];
  function otherVal(attr, v, f) {
    if (attr === 'fill') return pick(FILLS.filter(x => x !== v));
    if (attr === 'size') return v === 'L' ? 'S' : 'L';
    if (attr === 'count') return pick([1, 2, 3].filter(x => x !== v));
    if (attr === 'dot') return v ? 0 : 1;
    if (attr === 'rot') return (v + pick([90, 180, 270])) % 360;
  }
  function describeChange(attr, a, b) {
    if (attr === 'fill') return `turns from ${FILLNAME[a]} to ${FILLNAME[b]}`;
    if (attr === 'size') return b === 'S' ? 'gets smaller' : 'gets bigger';
    if (attr === 'count') return `goes from ${a} shape${a > 1 ? 's' : ''} to ${b} shape${b > 1 ? 's' : ''}`;
    if (attr === 'dot') return b ? 'gets a dot in the middle' : 'loses its dot';
    if (attr === 'rot') { const d = ((b - a) + 360) % 360; return d === 180 ? 'flips around to point the other way' : d === 90 ? 'turns a quarter turn to the right' : 'turns a quarter turn to the left'; }
  }
  function fmItem(level) {
    for (let t = 0; t < 500; t++) {
      const nCh = level === 0 ? 1 : level === 1 ? pick([1, 2]) : 2;
      const pool = level === 0 ? ['fill', 'size', 'count', 'dot'] : CH;
      const ch = shuffle(pool).slice(0, nCh);
      if (ch.includes('size') && ch.includes('count')) continue;
      const rotRule = ch.includes('rot');
      const shapes = rotRule ? shuffle(['arrow', 'triangle']) : shuffle(SHAPES).slice(0, 2);
      const A = baseFig({ shape: shapes[0], fill: pick(FILLS), size: ch.includes('count') ? 'L' : pick(['L', 'L', 'S']), count: ch.includes('size') ? 1 : pick([1, 1, 2]), rot: rotRule ? pick([0, 90, 180, 270]) : 0, dot: pick([0, 0, 1]) });
      if (A.fill === 'striped' && A.dot) A.dot = 0;
      const B = { ...A }; const to = {};
      for (const a of ch) { to[a] = otherVal(a, A[a]); B[a] = to[a]; }
      const C = { ...A, shape: shapes[1] };
      if (level === 2) { // also vary an unchanged attribute between A and C
        const free = ['fill', 'dot'].filter(x => !ch.includes(x)); if (free.length) { const x = pick(free); C[x] = otherVal(x, A[x]); }
      }
      const D = { ...C }; for (const a of ch) D[a] = (a === 'rot') ? (C.rot + ((B.rot - A.rot) + 360)) % 360 : to[a];
      const cands = [fopt(B), fopt(C)];
      for (const a of ch) { const x = { ...D, [a]: C[a] }; cands.push(fopt(x)); }
      for (const a of ch) { if (a === 'size' || a === 'dot') continue; let v = otherVal(a, D[a]); if (v === C[a]) v = otherVal(a, D[a]); cands.push(fopt({ ...D, [a]: v })); }
      const shuffled = [cands[0], ...shuffle(cands.slice(1))];
      const wrong = fillWrong(fkey(D), level === 0 ? shuffle(cands) : shuffled, 3, () => { const a = pick(['fill', 'dot']); return fopt({ ...D, [a]: otherVal(a, D[a]) }); });
      if (!wrong) continue;
      const desc = ch.map((a, i) => `${i ? '' : 'the shape '}${describeChange(a, A[a], B[a])}`).join(', and it ');
      return mk({ sub: 'fm', stim: matrix([fig(A), fig(B), fig(C)]), correct: fopt(D), wrong, prompt: 'Which shape goes in the empty box?',
        explain: `In the top row, ${desc}. Do the same thing to the bottom shape.` });
    }
  }

  // FIGURE CLASSIFICATION
  const DOM = { shape: SHAPES, fill: FILLS, count: [1, 2, 3], size: ['L', 'S'], dot: [0, 1] };
  function fcItem(level) {
    for (let t = 0; t < 800; t++) {
      const rule = pick(level === 0 ? ['shape', 'fill'] : level === 1 ? ['count', 'fill', 'dot', 'shape'] : ['size', 'dot', 'count', 'fill']);
      const held = level === 0 ? ['count', 'size', 'dot'] : level === 1 ? ['size'] : [];
      const heldVals = {}; for (const h of held) if (h !== rule) heldVals[h] = h === 'count' ? 1 : h === 'size' ? 'L' : h === 'dot' ? 0 : pick(DOM[h]);
      if (rule === 'size') heldVals.count = pick([1, 2]);
      const v = rule === 'dot' ? 1 : pick(DOM[rule]);
      const varying = Object.keys(DOM).filter(a => a !== rule && !(a in heldVals));
      const make = rv => { const f = baseFig({ ...heldVals }); f[rule] = rv; for (const a of varying) f[a] = pick(DOM[a]); if (f.fill === 'striped' && f.dot) { if (rule === 'fill') f.dot = 0; else f.fill = pick(['hollow', 'solid', 'gray']); } return f; };
      const S = [make(v), make(v), make(v)];
      if (varying.some(a => S.every(s => s[a] === S[0][a]))) continue;
      if (new Set(S.map(fkey)).size < 3) continue;
      const ans = make(v);
      if (S.some(s => fkey(s) === fkey(ans))) continue;
      const wrong = fillWrong(fkey(ans), [], 3, () => fopt(make(pick(DOM[rule].filter(x => x !== v)))));
      if (!wrong) continue;
      const why = rule === 'shape' ? `They are all ${SHAPENAME[v]}.` : rule === 'fill' ? `The shapes are all ${FILLNAME[v]}.` : rule === 'count' ? `Each box has ${v} shape${v > 1 ? 's' : ''}.` : rule === 'dot' ? (v ? 'They all have a dot in the middle.' : 'None of them has a dot in the middle.') : (v === 'S' ? 'The shapes are all small.' : 'The shapes are all big.');
      return mk({ sub: 'fc', stim: rowBox(S.map(fig)), correct: fopt(ans), wrong, prompt: 'Which shape goes best with the shapes in the top row?', explain: why + ' Look for what is the same about all three.' });
    }
  }

  // ---------- PAPER FOLDING ----------
  const GP = [0.125, 0.375, 0.625, 0.875];
  const FOLDS = {
    L: { m: ([x, y]) => [1 - x, y], keep: ([x]) => x > .5, name: 'the left side folds over to the right' },
    R: { m: ([x, y]) => [1 - x, y], keep: ([x]) => x < .5, name: 'the right side folds over to the left' },
    T: { m: ([x, y]) => [x, 1 - y], keep: ([, y]) => y > .5, name: 'the top folds down' },
    B: { m: ([x, y]) => [x, 1 - y], keep: ([, y]) => y < .5, name: 'the bottom folds up' },
    D1: { m: ([x, y]) => [y, x], keep: ([x, y]) => x < y, name: 'one corner folds over to make a triangle' },
    D2: { m: ([x, y]) => [1 - y, 1 - x], keep: ([x, y]) => x + y > 1, name: 'one corner folds over to make a triangle' },
  };
  const pk = p => p.map(v => v.toFixed(3)).join(',');
  const skey = S => 'h' + [...new Set(S.map(pk))].sort().join(';');
  const uniq = S => { const m = new Map(); S.forEach(p => m.set(pk(p), p)); return [...m.values()]; };
  function region(folds) { // returns polygon in unit coords of remaining paper
    let x0 = 0, x1 = 1, y0 = 0, y1 = 1, diag = null;
    for (const f of folds) { if (f === 'L') x0 = .5; if (f === 'R') x1 = .5; if (f === 'T') y0 = .5; if (f === 'B') y1 = .5; if (f === 'D1') diag = [[0, 0], [1, 1], [0, 1]]; if (f === 'D2') diag = [[1, 0], [1, 1], [0, 1]]; }
    return diag || [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  }
  function flapPoly(before, f) {
    const [[x0, y0], , [x1, y1]] = [before[0], before[1], before[2]];
    if (f === 'L') return [[x0, y0], [.5, y0], [.5, y1], [x0, y1]];
    if (f === 'R') return [[.5, y0], [x1, y0], [x1, y1], [.5, y1]];
    if (f === 'T') return [[x0, y0], [x1, y0], [x1, .5], [x0, .5]];
    if (f === 'B') return [[x0, .5], [x1, .5], [x1, y1], [x0, y1]];
    if (f === 'D1') return [[0, 0], [1, 0], [1, 1]];
    if (f === 'D2') return [[0, 0], [1, 0], [0, 1]];
  }
  function foldLine(before, f) {
    const [[x0, y0], , [x1, y1]] = [before[0], before[1], before[2]];
    if (f === 'L' || f === 'R') return [[.5, y0], [.5, y1]];
    if (f === 'T' || f === 'B') return [[x0, .5], [x1, .5]];
    if (f === 'D1') return [[0, 0], [1, 1]];
    if (f === 'D2') return [[1, 0], [0, 1]];
  }
  const S0 = 10, SZ = 80, tx = v => (S0 + v * SZ).toFixed(1);
  const poly = (p, st) => `<polygon points="${p.map(q => tx(q[0]) + ',' + tx(q[1])).join(' ')}" style="${st}"/>`;
  const PAPER = 'fill:var(--sheet);stroke:var(--ink);stroke-width:2;stroke-linejoin:round';
  const GHOST = 'fill:none;stroke:var(--ghost);stroke-width:1.5;stroke-dasharray:3 3';
  function arrowFor(f) {
    const a = { L: [[.3, .5], [.7, .5]], R: [[.7, .5], [.3, .5]], T: [[.5, .3], [.5, .7]], B: [[.5, .7], [.5, .3]], D1: [[.72, .28], [.35, .65]], D2: [[.28, .28], [.65, .65]] }[f];
    return `<line x1="${tx(a[0][0])}" y1="${tx(a[0][1])}" x2="${tx(a[1][0])}" y2="${tx(a[1][1])}" style="stroke:var(--accent);stroke-width:3.2;stroke-linecap:round" marker-end="url(#ahead)"/>`;
  }
  function paperPanel(folds, i, holes) {
    // state before fold i (i < folds.length) with fold marked; or final with holes
    const before = region(folds.slice(0, i));
    let s = `<svg class="pf" viewBox="0 0 100 100" aria-hidden="true"><rect x="10" y="10" width="80" height="80" style="${GHOST}"/>` + poly(before, PAPER);
    if (i < folds.length) {
      const f = folds[i];
      // only draw the flap tint within the current region
      const fl = flapPoly(before, f);
      if (f === 'D1' || f === 'D2') s += poly(fl, 'fill:var(--flap);stroke:none');
      else s += poly(fl, 'fill:var(--flap);stroke:none');
      const ln = foldLine(before, f);
      s += `<line x1="${tx(ln[0][0])}" y1="${tx(ln[0][1])}" x2="${tx(ln[1][0])}" y2="${tx(ln[1][1])}" style="stroke:var(--ink);stroke-width:2;stroke-dasharray:5 4"/>` + arrowFor(f);
    } else {
      s += holes.map(h => `<circle cx="${tx(h[0])}" cy="${tx(h[1])}" r="5.5" style="fill:var(--bg);stroke:var(--ink);stroke-width:1.8"/>`).join('');
    }
    return s + '</svg>';
  }
  function openPaper(holes) {
    return `<svg class="pf" viewBox="0 0 100 100" aria-hidden="true"><rect x="10" y="10" width="80" height="80" style="${PAPER}"/>` +
      holes.map(h => `<circle cx="${tx(h[0])}" cy="${tx(h[1])}" r="5.5" style="fill:var(--bg);stroke:var(--ink);stroke-width:1.8"/>`).join('') + '</svg>';
  }
  function pfItem(level) {
    for (let t = 0; t < 500; t++) {
      let folds, nh;
      if (level === 0) { folds = [pick(['L', 'R', 'T', 'B'])]; nh = 1; }
      else if (level === 1) { folds = [pick(['L', 'R', 'T', 'B', 'D1', 'D2'])]; nh = folds[0].startsWith('D') ? 1 : pick([1, 2]); }
      else { const v = pick(['L', 'R']), h = pick(['T', 'B']); folds = R() < 0.5 ? [v, h] : [h, v]; nh = pick([1, 1, 2]); }
      const pts = []; for (const x of GP) for (const y of GP) { const p = [x, y]; if (folds.every(f => FOLDS[f].keep(p))) pts.push(p); }
      if (pts.length < nh) continue;
      const punched = shuffle(pts).slice(0, nh);
      let S = punched.slice();
      const partial = [];
      for (let i = folds.length - 1; i >= 0; i--) { S = uniq(S.concat(S.map(FOLDS[folds[i]].m))); partial.push(S.slice()); }
      const correctKey = skey(S);
      const other = f => ({ L: 'T', R: 'B', T: 'L', B: 'R', D1: 'D2', D2: 'D1' })[f];
      const cands = [];
      const fo = H => ({ html: openPaper(H), key: skey(H) });
      cands.push(fo(punched));
      if (folds.length === 1) { cands.push(fo(uniq(punched.concat(punched.map(FOLDS[other(folds[0])].m))))); }
      else { cands.push(fo(partial[0])); cands.push(fo(uniq(punched.concat(punched.map(FOLDS[folds[0]].m))))); }
      const shift = () => { const H = S.slice(); const i = ri(0, H.length - 1); const all = []; for (const x of GP) for (const y of GP) all.push([x, y]); const free = all.filter(p => !H.some(h => pk(h) === pk(p))); H[i] = pick(free); return fo(H); };
      const wrong = fillWrong(correctKey, shuffle(cands), 3, shift);
      if (!wrong) continue;
      const stim = `<div class="pfrow">${folds.map((f, i) => `<div class="pfp">${paperPanel(folds, i)}</div>`).join('<span class="pfa" aria-hidden="true">›</span>')}<span class="pfa" aria-hidden="true">›</span><div class="pfp">${paperPanel(folds, folds.length, punched)}</div></div>`;
      const steps = folds.map(f => FOLDS[f].name).join(', then ');
      return mk({ sub: 'pf', stim, correct: fo(S), wrong, prompt: 'Which picture shows how the paper will look when it is opened?',
        explain: `First ${steps}. The hole${nh > 1 ? 's go' : ' goes'} through every layer, so when you unfold it there ${S.length === 1 ? 'is 1 hole' : 'are ' + S.length + ' holes'}, mirrored across each fold line.` });
    }
  }

  // ---------- public API ----------
  const GEN = { na: naItem, np: npItem, ns: nsItem, fm: fmItem, fc: fcItem, pf: pfItem };
  const BANK = { pa: [PA, PA_PRACTICE, paItem], sc: [SC, SC_PRACTICE, scItem], pc: [PC, PC_PRACTICE, pcItem] };
  const levelFor = (i, n) => (i < n * 0.34 ? 0 : i < n * 0.7 ? 1 : 2);
  function make(sub, n, seen) {
    if (BANK[sub]) {
      const [bank, , fn] = BANK[sub];
      return bankPick(bank, n, seen || new Set()).map(i => fn(bank[i], i));
    }
    const out = [], keys = new Set();
    for (let i = 0; i < n; i++) { let it, g = 0; do { it = GEN[sub](levelFor(i, n)); } while (keys.has(it.keys[it.answer] + it.stim.length) && g++ < 5); keys.add(it.keys[it.answer] + it.stim.length); out.push(it); }
    return out;
  }
  function practice(sub) {
    if (BANK[sub]) { const [, pr, fn] = BANK[sub]; return pr.map(b => fn(b, null)); }
    return [GEN[sub](0), GEN[sub](0)];
  }
  const bankSize = sub => (BANK[sub] ? BANK[sub][0].length : Infinity);
  return { make, practice, setRng, bankSize, banks: { pa: [PA, PA_PRACTICE], sc: [SC, SC_PRACTICE], pc: [PC, PC_PRACTICE] }, _gen: GEN };
})();


