import test from 'node:test';
import assert from 'node:assert/strict';
import {messages, chooseLanguage, chapterUrl} from '../i18n.js';

test('explicit link language wins over preference and browser', () => {
  assert.equal(chooseLanguage({search:'?lang=en', stored:'ru', languages:['ru-RU']}), 'en');
  assert.equal(chooseLanguage({search:'?lang=ru', stored:'en', languages:['en-US']}), 'ru');
});
test('saved choice, first browser language and invalid links have defined fallbacks', () => {
  assert.equal(chooseLanguage({stored:'ru', languages:['en']}), 'ru');
  assert.equal(chooseLanguage({search:'?lang=xx', stored:'bad', languages:['ru-RU']}), 'ru');
  assert.equal(chooseLanguage({languages:['de-DE', 'ru']}), 'en');
  assert.equal(chooseLanguage(), 'en');
});
test('both interfaces have the same complete message keys', () => {
  assert.deepEqual(Object.keys(messages.ru).sort(), Object.keys(messages.en).sort());
  for (const lang of ['ru','en']) for (const value of Object.values(messages[lang])) {
    assert.ok(Array.isArray(value) ? value.every(Boolean) : value.length > 0);
  }
});
test('share links retain chapter and language', () => {
  assert.equal(chapterUrl('atomicity','ru'), '/redis/?lang=ru#atomicity');
  assert.equal(chapterUrl('atomicity','en'), '/redis/?lang=en#atomicity');
});
