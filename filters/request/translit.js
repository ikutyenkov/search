const Model = require('./model.js');

const dictionary = {
    'а': ['a', 'f'],    'б': ['b', ','],    'в': ['v', 'd'],    'г': ['g', 'u'],    'д': ['d', 'l'],
    'е': ['e', 't'],    'ё': ['e', '`'],    'ж': ['zh', ';'],   'з': ['z', 'p'],    'и': ['i', 'b'],
    'й': ['y', 'q'],    'к': ['k', 'r'],    'л': ['l', 'k'],    'м': ['m', 'v'],    'н': ['n', 'y'],
    'о': ['o', 'j'],    'п': ['p', 'g'],    'р': ['r', 'h'],    'с': ['s', 'c'],    'т': ['t', 'n'],
    'у': ['u', 'e'],    'ф': ['f', 'a'],    'х': ['h', '['],    'ц': ['c', 'w'],    'ч': ['ch', 'x'],
    'ш': ['sh', 'i'],   'щ': ['sch', 'o'],  'ь': ['', 'm'],     'ы': ['y', 's'],    'ъ': ['', ']'],
    'э': ['e', '\''],    'ю': ['yu', '.'],   'я': ['ya', 'z']
};

class Filter extends Model {

    async _prepare()
    {
        this.dictionarys = {"translit" : {}, "switch" : {}};

            for (let _symbol in dictionary) {

                for (let i = 0; i < 2; i++) {

                    let _symbols = [
                        i > 0 ? _symbol.toUpperCase() : _symbol,
                        i > 0 ? dictionary[_symbol][0].toUpperCase() : dictionary[_symbol][0],
                        i > 0 ? dictionary[_symbol][1].toUpperCase() : dictionary[_symbol][1]
                    ];

                    this.dictionarys['translit'][ _symbols[0] ] = _symbols[1] ;
                    this.dictionarys['switch'][ _symbols[0] ] = _symbols[2] ;
                    this.dictionarys['switch'][ _symbols[2] ] = _symbols[0] ;
                }
            }

        return super._prepare();
    }

    async _processing(target)
    {
        return [target, this._convert(target, 'switch') + '^0.6', this._convert(target, 'translit') + '^0.6'];
    }

    _convert(str, dict)
    {
        let _converted = '';

            for (let i = 0; i < str.length; i++) {
                _converted += this.dictionarys[dict][ str[i] ] ?? str[i];
            }

        return _converted;
    }
}

module.exports = Filter;