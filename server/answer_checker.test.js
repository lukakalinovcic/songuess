/*jslint indent: 2, plusplus: true*/
"use strict";

var checker = new(require('./answer_checker'))();

function check(actual, attempted) {
  return checker.checkAnswer(actual, attempted);
}

test('accepted pairs', () => {
  expect(check('djakovo', 'đakovo')).toBe(true);
  expect(check('nesto (nema) [nema ni ovog]', 'nesto')).toBe(true);
  expect(check('ručak', 'rucak')).toBe(true);
  expect(check('žiroskop', 'ziroskop')).toBe(true);
  expect(check('ćup', 'cup')).toBe(true);
  expect(check('šalica', 'salica')).toBe(true);
  expect(check('šaš', 'sas')).toBe(true);
  expect(check('šas', 'saš')).toBe(true);
  expect(check('šalica kafe vozi džip u đakovu',
    'salica kafe vozi dzip u djakovu')).toBe(true);
  expect(check('aanton', 'aantoj')).toBe(true);
  expect(check('antonantonantonanaaaaaaaaaatonanton',
    'antonantonantonanaaaaaaaaaatonanton33')).toBe(true);
  expect(check('un ane plane', 'Un Âne Plane')).toBe(true);
  expect(check('madam reve', 'Madame Rêve')).toBe(true);
  expect(check('cest ecrit', 'C\'est Écrit')).toBe(true);
  expect(check('sdjccz', 'šđčćž')).toBe(true);
  expect(check('aaaa', 'áàâã')).toBe(true);
  expect(check('eeee', 'éèêë')).toBe(true);
  expect(check('iii', 'íîï')).toBe(true);
  expect(check('oo', 'óô')).toBe(true);
  expect(check('uuu', 'úùû')).toBe(true);
  expect(check('cnaeoe', 'çñæœ')).toBe(true);
  expect(check('triptico', 'Tríptico')).toBe(true);
  expect(check('para machucar meu coracao', 'Para Machucar Meu Coração')).toBe(
    true);
  expect(check('up', 'Up!')).toBe(true);
  expect(check('7', '7')).toBe(true);
  expect(check('petite soeur', 'Petite Sœur')).toBe(true);
  expect(check('ex aequo', 'Ex Æquo')).toBe(true);
  expect(check('le chene liege', 'le chêne liège')).toBe(true);
  expect(check('this is my answer #playon', 'this is my answer')).toBe(
    true);
  expect(check('this is #playon my answer', 'this is my answer')).toBe(
    true);
  expect(check('Don Prle (iza nevidjenog)', 'don prle iza nevidjenog')).toBe(
    true);
  expect(check('(I Can\'t Get No) Satisfaction',
    'i cant get no satisfaction')).toBe(true);
  expect(check('nice dream', '(Nice dream)')).toBe(true);
  expect(check('2+2=5', '2 + 2 = 5')).toBe(true);
  expect(check('jebeno', 'jeebno')).toBe(true);
  expect(check('(I Can\'t Get No) Satisfaction (Mono version)',
    'satisfaction')).toBe(true);
  expect(check('(I Can\'t Get No) Satisfaction (Mono version)',
    'i cant get no satisfaction')).toBe(true);
  expect(check('Everybody (Backstreet\'s back)', 'everybody')).toBe(true);
  expect(check('Everybody (Backstreet\'s back)', 'backstreets back')).toBe(
    true);
  expect(check('Corcovado (quiet nights of quiet stars)', 'corcovado')).toBe(
    true);
  expect(check('Corcovado (quiet nights of quiet stars)',
    'quiet nights of quiet stars')).toBe(true);
  expect(check('Dark Horse feat Juicy J', 'dark horse')).toBe(true);
  // This weird z letter appeared while playing.
  expect(check('Kažu', 'kazu')).toBe(true);
  expect(check('The real slim shady', 'real slim shady')).toBe(true);
  expect(check('L-O-V-E', 'l-o-v-e')).toBe(true);
  expect(check('L-O-V-E', 'l o v e')).toBe(true);
  expect(check('Schön', 'schoen')).toBe(true);
  expect(check('Schlüssel', 'schluessel')).toBe(true);
  expect(check('Zähne', 'zaehne')).toBe(true);
  expect(check('Straße', 'strasse')).toBe(true);
  expect(check('Surfin U.S.A.', 'surfin u.s.a.')).toBe(true);
  expect(check('Surfin U.S.A.', 'surfin usa')).toBe(true);
  expect(check('Let It Be - Remastered 2009', 'let it be')).toBe(true);
  expect(check('You Oughta Know - 2015 Remaster', 'you oughta know')).toBe(true);
  expect(check('Good Vibrations - Remastered', 'good vibrations')).toBe(true);
  expect(check('Everybody (Backstreet\'s Back) - Radio Edit', 'everybody')).toBe(
    true);
  expect(check('Everybody (Backstreet\'s Back) - Radio Edit',
    'backstreets back')).toBe(true);
  expect(check('Stayin\' alive - From "Saturday Night Fever" Soundtrack',
    'stayin alive')).toBe(true);
  expect(check('Lady Marmelade - From "Moulin Rouge" Soundtrack',
    'lady marmelade')).toBe(true);
  expect(check('Stan (feat. Dido)', 'stan')).toBe(true);
  expect(check('Get Lucky (feat. Pharell Williams) - Radio Edit', 'get lucky'))
    .toBe(true);
});

test('rejected pairs', () => {
  expect(check('7', '5')).toBe(false);
  expect(check('2+2=5', '')).toBe(false);
  expect(check('some song (Live)', 'live')).toBe(false);
  expect(check('Stan (feat. Dido)', 'feat dido')).toBe(false);
  expect(check('some song (version 2003)', 'version 2003')).toBe(false);
  expect(check('some song (Mix 2011)', 'mix 2011')).toBe(false);
  expect(check('some song (remastered)', 'remastered')).toBe(false);
  expect(check('some song (from Hair soundtrack)', 'from hair soundtrack'))
    .toBe(false);
  expect(check('some song (instrumental)', 'instrumental')).toBe(false);
  // Arguable, but the title is really spelled out intentionally.
  expect(check('L-O-V-E', 'love')).toBe(false);
  // Not sure who would spell it out like this, I'm including it here for
  // completion because we have it in positive cases above.
  expect(check('Surfin U.S.A.', 'surfin u s a')).toBe(false);
  // I decided that this example is fine not to accept.
  // Feels to risky to accept supersets of the correct answer.
  expect(check('Umoran sam', 'umoran sam prijatelju')).toBe(false);
  expect(check('Schön', 'Schon')).toBe(false);
});
