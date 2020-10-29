var ac = require('./answer_checker');
ac = new ac();

// TODO: all commented tests should pass!
// Format is [Correct Title, attempted answer]
var validPairs = [
  ['djakovo', 'đakovo'],
  ['nesto (nema) [nema ni ovog]', 'nesto'],
  ['ručak', 'rucak'],
  ['žiroskop', 'ziroskop'],
  ['ćup', 'cup'],
  ['šalica', 'salica'],
  ['šaš', 'sas'],
  ['šas', 'saš'],
  ['šalica kafe vozi džip u đakovu', 'salica kafe vozi dzip u djakovu'],
  ['aanton', 'aantoj'],
  ['antonantonantonanaaaaaaaaaatonanton', 'antonantonantonanaaaaaaaaaatonanton33'],
  ['un ane plane', 'Un Âne Plane'],
  ['madam reve', 'Madame Rêve'],
  ['cest ecrit', 'C\'est Écrit'],
  ['sdjccz','šđčćž'],
  ['aaaa','áàâã'],
  ['eeee','éèêë'],
  ['iii','íîï'],
  ['oo','óô'],
  ['uuu','úùû'],
  ['cnaeoe','çñæœ'],
  ['triptico', 'Tríptico'],
  ['para machucar meu coracao', 'Para Machucar Meu Coração'],
  ['up', 'Up!'],
  ['7', '7'],
  ['petite soeur', 'Petite Sœur'],
  ['ex aequo', 'Ex Æquo'],
  ['le chene liege', 'le chêne liège'],
  ['this is my answer #playon', 'this is my answer'],
  ['this is #playon my answer', 'this is my answer'],
  ['Don Prle (iza nevidjenog)', 'don prle iza nevidjenog'],
  ['(I Can\'t Get No) Satisfaction', 'i cant get no satisfaction'],
  ['nice dream', '(Nice dream)'],
  ['2+2=5', '2 + 2 = 5'],
  ['jebeno', 'jeebno'],
  ['(I Can\'t Get No) Satisfaction (Mono version)', 'satisfaction'],
  ['(I Can\'t Get No) Satisfaction (Mono version)', 'i cant get no satisfaction'],
  ['Everybody (Backstreet\'s back)', 'everybody'],
  ['Everybody (Backstreet\'s back)', 'backstreets back'],
  ['Corcovado (quiet nights of quiet stars)', 'corcovado'],
  ['Corcovado (quiet nights of quiet stars)', 'quiet nights of quiet stars'],
  ['Dark Horse feat Juicy J', 'dark horse'],
  ['Kažu', 'kazu'],  // This weird z letter appeared while playing.
  ['The real slim shady', 'real slim shady'],
  ['L-O-V-E', 'l-o-v-e'],
  ['L-O-V-E', 'l o v e'],
  ['Schön', 'schoen'],
  ['Schlüssel', 'schluessel'],
  ['Zähne', 'zaehne'],
  ['Straße', 'strasse'],
  ['Surfin U.S.A.', 'surfin u.s.a.'],
  ['Surfin U.S.A.', 'surfin usa'],
  ['Let It Be - Remastered 2009', 'let it be'],
  ['You Oughta Know - 2015 Remaster', 'you oughta know'],
  ['Good Vibrations - Remastered', 'good vibrations'],
  ['Everybody (Backstreet\'s Back) - Radio Edit', 'everybody'],
  ['Everybody (Backstreet\'s Back) - Radio Edit', 'backstreets back'],
  ['Stayin\' alive - From "Saturday Night Fever" Soundtrack', 'stayin alive'],
  ['Lady Marmelade - From "Moulin Rouge" Soundtrack', 'lady marmelade'],
  ['Stan (feat. Dido)', 'stan'],
  ['Get Lucky (feat. Pharell Williams) - Radio Edit', 'get lucky'],
];

var invalidPairs = [
  ['7', '5'],
  ['2+2=5', ''],
  ['some song (Live)', 'live'],
  ['Stan (feat. Dido)', 'feat dido'],
  ['some song (version 2003)', 'version 2003'],
  ['some song (Mix 2011)', 'mix 2011'],
  ['some song (remastered)', 'remastered'],
  ['some song (from Hair soundtrack)', 'from hair soundtrack'],
  ['some song (instrumental)', 'instrumental'],
  // Arguable, but the title is really spelled out intentionally.
  ['L-O-V-E', 'love'],
  // Not sure who would spell it out like this, I'm including it here for
  // completion because we have it in positive cases above.
  ['Surfin U.S.A.', 'surfin u s a'],
  // I decided that this example is fine not to accept.
  // Feels to risky to accept supersets of the correct answer.
  ['Umoran sam', 'umoran sam prijatelju'],
  // ['[]', '(...)'],
  // ['(Nice dream)', '()'],
  // ['Neighborhood #1 (Tunnels)', 'Neighborhood #4 (7 Kettles)'],
  ['Schön', 'Schon'],
];

var validPairsFullItems = [
  [{title: 'nevalja', title2: 'valja'}, 'valja'],
  [{title: 'nevalja', title2: 'stvarnonevalja', title3: 'valja'}, 'valja'],
  [{title: 'BIJELO DUGME - pingvin', artist: "bijelo dugme"}, 'pingvin'],
  [{title: 'BIJELO DUGME - pingvin', artist: "Bijelo Dugme"}, 'pingvin'],
  [{title: 'BIJELO DUGME - pingvin', artist: "BIJELO DUGME"}, 'pingvin'],
  [{title: 'BIJELO DUGME / pingvin', artist: "BIJELO DUGME"}, 'pingvin'],
  [{title: 'BIJELO DUGME _ pingvin', artist: "BIJELO DUGME"}, 'pingvin'],
];

var invalidPairsFullItems = [
  [{artist: 'nevalja', titlA: 'valja'}, 'valja'],
];

var counter = 0;
function check(item, answer, shouldPass) {
  var passed = ac.checkAnswer(item, answer);
  if (passed != shouldPass) {
    console.log("Test failed. Expected: ",
        shouldPass ? "CORRECT" : "NOT CORRECT", " for: ");
    console.log(item, answer);
    ++counter;
    console.log('');
  }
}

console.log('');
for (i = 0; i < validPairs.length; ++i) {
  check({ title: validPairs[i][0] }, validPairs[i][1], true);
}

for (i = 0; i < invalidPairs.length; ++i) {
  check({ title: invalidPairs[i][0] }, invalidPairs[i][1], false);
}

for (i = 0; i < validPairsFullItems.length; ++i) {
  check(validPairsFullItems[i][0], validPairsFullItems[i][1], true);
}

for (i = 0; i < invalidPairsFullItems.length; ++i) {
  check(invalidPairsFullItems[i][0], invalidPairsFullItems[i][1], false);
}

if (counter){
  console.log('Failed ' + counter + ' tests.  :(');
} else {
  console.log(
    'Passed all ' + (validPairs.length + invalidPairs.length) + ' tests \\o/'
  );
}
console.log('');

