//adapted from https://github.com/hrbn/tally/blob/main/src/helpers/syntax.ts

import { formulas } from './formulas';
import { builtins, constants, functions, operatorKeywords, units } from './keywords';

function words(array: string[]): Record<string, boolean> {
  const keys: Record<string, boolean> = {};
  for (let i = 0; i < array.length; ++i) {
    keys[array[i]] = true;
  }
  return keys;
}

const OperatorKeywords = words(operatorKeywords);
const Constants = words(constants);
const Functions = words(functions);
const Units = words(units);
const Builtins = words(builtins);

const isOperatorChar = /[+\-*&=<>/:^%!]/;

function tokenBase(stream: any, state: any): string | null {
  const ch = stream.next();
  if (ch == '#' || (ch == '/' && stream.eat('/'))) {
    stream.skipToEnd();
    return 'comment';
  }
  if (ch == '"' || ch == "'") {
    state.tokenize = tokenString(ch);
    return state.tokenize(stream, state);
  }
  if (/[$£€¥₽¥]/.test(ch)) {
    return 'variableName.special';
  }
  if (/[[\](),]/.test(ch)) {
    return null;
  }
  if (/[\d.]/.test(ch)) {
    stream.eatWhile(/^(\d+((,\d{3})+)?)?(\.(\d+)?)?(e[+-]?\d+)?(M |k )?$/);
    return 'number';
  }
  if (isOperatorChar.test(ch)) {
    stream.eatWhile(isOperatorChar);
    return 'operator';
  }
  stream.eatWhile(/[\w_]/);
  const word = stream.current();

  if (Object.hasOwn(OperatorKeywords, word)) {
    return 'operatorKeyword';
  }
  if (Object.hasOwn(Constants, word)) {
    return 'variableName.standard';
  }
  if (Object.hasOwn(Builtins, word)) {
    return 'variableName.standard';
  }
  if (Object.hasOwn(Units, word)) {
    return 'variableName.special';
  }
  if (Object.hasOwn(Functions, word)) {
    return 'function';
  }
  if (stream.peek() === '(') {
    return 'variableName.definition';
  }
  return 'variable';
}

function tokenString(quote: string): (stream: any, state: any) => string {
  return function (stream, state) {
    let escaped = false,
      next,
      end = false;
    while ((next = stream.next()) != null) {
      if (next == quote && !escaped) {
        end = true;
        break;
      }
      escaped = !escaped && next == '\\';
    }
    if (end || !escaped) state.tokenize = null;
    return 'string';
  };
}

export const mathjs = {
  name: 'mkformula',
  startState: function (): { tokenize: null; } {
    return { tokenize: null };
  },

  token: function (stream: any, state: any): string | null {
    if (stream.eatSpace()) return null;
    const style = (state.tokenize || tokenBase)(stream, state);
    if (style == 'comment' || style == 'meta') return style;
    return style;
  },

  languageData: {
    autocomplete: Object.keys(formulas),
    closeBrackets: { brackets: ['(', '[', '{', "'", '"', '`'] },
    commentTokens: { line: '#' }
  }
};