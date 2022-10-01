# kitsune
kitsune is yet another argument parser, which was introduced in [@modularium/fox](https://github.com/modularium/fox).

```sh
$ npm i @sooomucheffort/kitsune
$ yarn add @sooomucheffort/kitsune
```

## Example

```js
const { KitsuneParser, KitsuneParserError, KitsuneParserType } = require('@sooomucheffort/kitsune')

const kp = new KitsuneParser()

try {
  const parsed = kp.parse(
    [
      'first argument', 
      2,
      false
    ], 
    [
      {
        type: KitsuneParserType.STRING
      }, 
      {
        type: KitsuneParserType.NUMBER
      }, 
      {
        type: KitsuneParserType.BOOLEAN
      }
    ]
  )

  console.log(parsed)
} catch (e) {
  if (e instanceof KitsuneParserError) {
    console.log(e)
    // ...
  } else {
    // ...
  }
}
```

## Types

### Standard ones
`KitsuneParserType` has 3 standard types, which include `KitsuneParserType.STRING`, `KitsuneParserType.NUMBER`, `KitsuneParserType.BOOLEAN`

### Creating your own
There is 2 ways to create your own type:

1. From constructor
```js
const { KitsuneParserType } = require('@sooomucheffort/kitsune')

const type = new KitsuneParserType(
  'name', 
  val => /* validate the value */,
  val => /* transform the value */
)
```

2. Extend original class with your own features
```js
const { KitsuneParserType } = require('@sooomucheffort/kitsune')

class MyOwnParserType extends KitsuneParserType {
  _validate(value) { /* ... */ }

  _transform(value) { /* ... */ }
}
```

## Options for an argument

You can add your options:
```js
// This will throw an error because value isn't a string EXPLICITLY, otherwise it will transform any object to string value
const parsed = kp.parse(
  [
    false
  ], 
  [
    {
      type: KitsuneParserType.STRING,
      explicit: true
    }
  ]
)
```

### `count: -1`
This option will collect all other arguments in one
```js
const parsed = kp.parse(
  [
    'hi',
    1,
    2,
    3
  ], 
  [
    {
      type: KitsuneParserType.STRING
    },
    {
      type: KitsuneParserType.NUMBER,
      count: -1
    }
  ]
)

console.log(parsed) // [ 'hi', [ 1, 2, 3 ] ]
```

### `required: false`
With this option, if a type doesn't validate this value it will just ignore it
```js
const oddOrEven = new KitsuneParserType('oddOrEven', 
    (val, opts) => !opts.required || Number.isInteger(val), 
    val => Number.isInteger(val) ? (parseInt(val) % 2) !== 1 ? 'even' : 'odd' : 'neither'
)

/*
const oddOrEven = new KitsuneParserType('oddOrEven', 
    val => Number.isInteger(val), 
    val => (parseInt(val) % 2) !== 1
)
*/

const parsed = kp.parse(
  [
    1,
    'string'
  ], 
  [
    {
      type: oddOrEven
    },
    {
      type: oddOrEven,
      required: false
    }
  ]
)

console.log(parsed) // [ 'odd', 'neither' ]
```