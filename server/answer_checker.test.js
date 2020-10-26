/*jslint indent: 2, plusplus: true*/
"use strict";

var checker = new (require('./answer_checker'))();

function check(actual, attempted) {
  return checker.checkAnswer(actual, attempted);
}

test('accepted pairs', () => {
  expect(check('djakovo', 'đakovo')).toEqual(true);
  expect(check('nesto (nema) [nema ni ovog]', 'nesto')).toEqual(true);
  expect(check('ručak', 'rucak')).toEqual(true);
  expect(check('žiroskop', 'ziroskop')).toEqual(true);
  expect(check('ćup', 'cup')).toEqual(true);
  expect(check('šalica', 'salica')).toEqual(true);
  expect(check('šaš', 'sas')).toEqual(true);
  expect(check('šas', 'saš')).toEqual(true);
  expect(check('šalica kafe vozi džip u đakovu', 'salica kafe vozi dzip u djakovu')).toEqual(true);
  expect(check('aanton', 'aantoj')).toEqual(true);
  expect(check('antonantonantonanaaaaaaaaaatonanton', 'antonantonantonanaaaaaaaaaatonanton33')).toEqual(true);
  expect(check('un ane plane', 'Un Âne Plane')).toEqual(true);
  expect(check('madam reve', 'Madame Rêve')).toEqual(true);
  expect(check('cest ecrit', 'C\'est Écrit')).toEqual(true);
  expect(check('sdjccz','šđčćž')).toEqual(true);
  expect(check('aaaa','áàâã')).toEqual(true);
  expect(check('eeee','éèêë')).toEqual(true);
  expect(check('iii','íîï')).toEqual(true);
  expect(check('oo','óô')).toEqual(true);
  expect(check('uuu','úùû')).toEqual(true);
  expect(check('cnaeoe','çñæœ')).toEqual(true);
  expect(check('triptico', 'Tríptico')).toEqual(true);
  expect(check('para machucar meu coracao', 'Para Machucar Meu Coração')).toEqual(true);
  expect(check('up', 'Up!')).toEqual(true);
  expect(check('7', '7')).toEqual(true);
  expect(check('petite soeur', 'Petite Sœur')).toEqual(true);
  expect(check('ex aequo', 'Ex Æquo')).toEqual(true);
  expect(check('le chene liege', 'le chêne liège')).toEqual(true);
  expect(check('this is my answer #playon', 'this is my answer')).toEqual(true);
  expect(check('this is #playon my answer', 'this is my answer')).toEqual(true);
  expect(check('Don Prle (iza nevidjenog)', 'don prle iza nevidjenog')).toEqual(true);
  expect(check('(I Can\'t Get No) Satisfaction', 'i cant get no satisfaction')).toEqual(true);
  expect(check('nice dream', '(Nice dream)')).toEqual(true);
  expect(check('2+2=5', '2 + 2 = 5')).toEqual(true);
  expect(check('jebeno', 'jeebno')).toEqual(true);
  expect(check('(I Can\'t Get No) Satisfaction (Mono version)', 'satisfaction')).toEqual(true);
  expect(check('(I Can\'t Get No) Satisfaction (Mono version)', 'i cant get no satisfaction')).toEqual(true);
  expect(check('Everybody (Backstreet\'s back)', 'everybody')).toEqual(true);
  expect(check('Everybody (Backstreet\'s back)', 'backstreets back')).toEqual(true);
  expect(check('Corcovado (quiet nights of quiet stars)', 'corcovado')).toEqual(true);
  expect(check('Corcovado (quiet nights of quiet stars)', 'quiet nights of quiet stars')).toEqual(true);
  expect(check('Dark Horse feat Juicy J', 'dark horse')).toEqual(true);
  // This weird z letter appeared while playing.
  expect(check('Kažu', 'kazu')).toEqual(true);
  expect(check('The real slim shady', 'real slim shady')).toEqual(true);
  expect(check('L-O-V-E', 'l-o-v-e')).toEqual(true);
  expect(check('L-O-V-E', 'l o v e')).toEqual(true);
  expect(check('Schön', 'schoen')).toEqual(true);
  expect(check('Schlüssel', 'schluessel')).toEqual(true);
  expect(check('Zähne', 'zaehne')).toEqual(true);
  expect(check('Straße', 'strasse')).toEqual(true);
  expect(check('Surfin U.S.A.', 'surfin u.s.a.')).toEqual(true);
  expect(check('Surfin U.S.A.', 'surfin usa')).toEqual(true);
});

test('rejected pairs', () => {
  expect(check('7', '5')).toEqual(false);
  expect(check('2+2=5', '')).toEqual(false);
  expect(check('some song (Live)', 'live')).toEqual(false);
  expect(check('Stan (feat. Dido)', 'feat dido')).toEqual(false);
  expect(check('some song (version 2003)', 'version 2003')).toEqual(false);
  expect(check('some song (Mix 2011)', 'mix 2011')).toEqual(false);
  expect(check('some song (remastered)', 'remastered')).toEqual(false);
  expect(check('some song (from Hair soundtrack)', 'from hair soundtrack')).toEqual(false);
  expect(check('some song (instrumental)', 'instrumental')).toEqual(false);
  // Arguable, but the title is really spelled out intentionally.
  expect(check('L-O-V-E', 'love')).toEqual(false);
  // Not sure who would spell it out like this, I'm including it here for
  // completion because we have it in positive cases above.
  expect(check('Surfin U.S.A.', 'surfin u s a')).toEqual(false);
  // I decided that this example is fine not to accept.
  // Feels to risky to accept supersets of the correct answer.
  expect(check('Umoran sam', 'umoran sam prijatelju')).toEqual(false);
  expect(check('Schön', 'Schon')).toEqual(false);
});
