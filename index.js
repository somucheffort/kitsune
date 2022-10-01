function findLastIndex (array, predicate) {
    let l = array.length
    while (l--) {
        if (predicate(array[l], l, array)) { return l }
    }
    return -1
}

/**
 * KitsuneParser
 *
 * Can be used for advanced commands with parsing arguments.
 * Usage: new KitsuneParser()
 */
class KitsuneParser {
    /**
     * KitsuneParser
     *
     * Can be used for advanced commands with parsing arguments.
     */
    constructor () {}

    async parseAsync(args, usage) {
        return await this.parse(args, usage)
    }

    /**
     * Parse the arguments.
     * 
     * @param {array} args arguments that need to be parsed
     * @param {object} usage object that contains usage for every single argument
     * @returns {array} parsed arguments with their own types
     */
    parse (args, usage) {
        const parsed = []
        if (!Array.isArray(usage)) {
            throw new KitsuneParserMessageError('Parser arguments must be an array.')
        }

        // required key fix start
        usage = usage.map(arg => {
            if (arg.required === undefined) {
                arg.required = true
            }
            return arg
        })
        
        const requiredArray = usage.map(arg => arg.required)

        const len = requiredArray.filter(val => val === false).length
        const pos = findLastIndex(requiredArray, val => val === false)

        if (len > 1) {
            throw new KitsuneParserArgumentError(undefined, pos, undefined, {
                id: 'NON_REQUIRED_ARGUMENT_MUST_BE_ONE',
                message: 'Non-required argument must be only one.'
            })
        }

        if (pos < requiredArray.length - 1 && pos !== -1) {
            throw new KitsuneParserArgumentError(undefined, pos, undefined, {
                id: 'NON_REQUIRED_ARGUMENT_AT_THE_END',
                message: 'Non-required argument must be at the end of the arguments array.'
            })
        }
        // required key fix end

        let usageIndex = 0

        usage.forEach(({ type, required, count, ...otherOptions }) => {
            const currentArgument = count ? args.slice(usageIndex, count === -1 ? usageIndex + args.length: usageIndex + count) : args[usageIndex]
            let result

            if (!Array.isArray(type)) {
                if (!(type instanceof KitsuneParserType)) throw new KitsuneParserArgumentError(undefined, pos, type, {
                    id: 'TYPE_IS_NOT_KITSUNEPARSERTYPE',
                    message: 'Type is not created from new KitsuneParserType(name, validate, transform) or instanceof KitsuneParserType'
                })

                if (!Array.isArray(currentArgument)) { 
                    result = type.options(otherOptions).parse(currentArgument) 
                } else {
                    result = currentArgument.map(arg => type.options(otherOptions).parse(arg))
                }
            } else {
                type.some(t => {
                    if (!(t instanceof KitsuneParserType)) throw new KitsuneParserArgumentError(undefined, pos, t, {
                        id: 'TYPE_IS_NOT_KITSUNEPARSERTYPE',
                        message: 'Type is not created from new KitsuneParserType(name, validate, transform) or instanceof KitsuneParserType'
                    })

                    if (!Array.isArray(currentArgument)) { 
                        result = t.options(otherOptions).parse(currentArgument) 
                    } else {
                        result = currentArgument.map(arg => t.options(otherOptions).parse(arg, otherOptions))
                    }
                })
            }

            if (Array.isArray(result)) {
                const indices = result.flatMap((bool, index) => bool !== undefined ? [] : index)

                if (indices.length) {
                    throw new KitsuneParserArgumentError(currentArgument[indices[0]], usageIndex + indices[0], type, {
                        id: 'REQUIRED_ARGUMENT_UNDEFINED',
                        message: 'Required argument is undefined'
                    })
                }

                if (result.length < count) {
                    throw new KitsuneParserArgumentError(currentArgument, usageIndex, type, {
                        id: 'ARGUMENTS_COUNT_IS_NOT_EQUAL_TYPE_COUNT',
                        message: 'Passed arguments count is not equal to type count.'
                    })
                }
            }

            if (result === undefined && required) {
                throw new KitsuneParserArgumentError(currentArgument, usageIndex, type, {
                    id: 'NO_REQUIRED_ARGUMENT',
                    message: 'Required argument is undefined'
                })
            }
            
            parsed.push(Array.isArray(result) ? result.map(e => e) : result)
            count ? usageIndex += count : usageIndex++
        })

        return parsed
    }
}



/**
 * KitsuneParser
 *
 * Can be used for advanced commands with parsing arguments.
 * Usage: new KitsuneParserType(name, validate, transform)
 */
 class KitsuneParserType {
    static STRING = new KitsuneParserType(
        'string', 
        (val, options) => options.explicit ? typeof val === 'string' || val instanceof String : true,
        val => String(val)
    )
    static NUMBER = new KitsuneParserType(
        'number', 
        val => !isNaN(val) || typeof val === 'number' || val instanceof Number,
        val => parseInt(val)
    )
    static BOOLEAN = new KitsuneParserType(
        'boolean', 
        val => String(val) === 'true' || String(val) === 'false',
        val => String(val) === 'true'
    )
    
    /**
     * Create new parser type
     * @param {string} name name of the type 
     * @param {function} validate value validator function
     * @param {function} transform value transformer function
     */
    constructor(name, validate, transform) {
        this._name = name
        this._validate = validate || this._validate
        this._transform = transform || this._transform
        this._options = {}
    }

    /**
     * Add any options for parsing. Used in _validate(value) function
     * @param {JSON} opts 
     */
    options(opts) {
        this._options = opts
        return this
    }

    /**
     * This is a bare-bones function. Create new type or override this function in your type class.
     * 
     * Validate any given value.
     * @param {*} value 
     */
    _validate(value) { }

    /**
     * This is a bare-bones function. Create new type or override this function in your type class.
     * 
     * Transform any given value if validated by _validate(value) function.
     * @param {*} value 
     */
    _transform(value) { }

    /**
     * Parse the value by given validation and transforming functions.
     * You may add options by options({ ... }) before this function.
     */
    parse(value) {
        return this._validate(value, this._options) && this._transform(value) || undefined
    }
}



/**
 * Default kitsune error.
 * Usage: (e instanceof KitsuneParserError)
 */
 class KitsuneParserError extends Error {
    constructor (m) {
        super(m)
        this.message = m
        this.name = 'KitsuneParserError'
    }
}

/**
 * Default parser argument error.
 * Usage: new KitsuneParserArgumentError(value, index, type, message)
 */
class KitsuneParserArgumentError extends KitsuneParserError {
    /**
     * Argument error of KitsuneParser
     *
     * @param {*} value value of argument
     * @param {number} index index of argument
     * @param {string} type type of argument
     * @param {string=} message additional message
     */
    constructor (value, index, type, message) {
        super(message || undefined)
        this.value = value
        this.index = index
        this.type = type
    }
}

class KitsuneParserMessageError extends KitsuneParserError {
    /**
     * Message error of KitsuneParser.
     *
     * @param {String} message message
     */
    constructor (message) {
        super(message)
    }
}

module.exports = { 
    KitsuneParserError, 
    KitsuneParserArgumentError, 
    KitsuneParserMessageError,
    KitsuneParserType,
    KitsuneParser
}