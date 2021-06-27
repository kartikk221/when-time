# whenTime: A Simple Package To Do Things On Time In Node.js

<div align="left">

[![NPM version](https://img.shields.io/npm/v/when-time.svg?style=flat)](https://www.npmjs.com/package/when-time)
[![NPM downloads](https://img.shields.io/npm/dm/when-time.svg?style=flat)](https://www.npmjs.com/package/when-time)
[![Language grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/kartikk221/when-time.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/kartikk221/when-time/context:javascript)
[![GitHub issues](https://img.shields.io/github/issues/kartikk221/when-time)](https://github.com/kartikk221/when-time/issues)
[![GitHub stars](https://img.shields.io/github/stars/kartikk221/when-time)](https://github.com/kartikk221/when-time/stargazers)
[![GitHub license](https://img.shields.io/github/license/kartikk221/when-time)](https://github.com/kartikk221/when-time/blob/master/LICENSE)

</div>

## Motivation
This package aims to simplify the task of scheduling tasks at specified time with a simple-to-use API. This can be helpful for making your applications restart at specific times in the day or having specific operations occur at a time period with repetitions.

## Features
- Simple-to-use API
- Timezones Support
- Human Readable Parameters
- Chainable Syntax
- Memory Efficient
- Lightweight/No Dependencies

## Installation
whenTime can be installed using node package manager (`npm`)
```
npm i when-time
```

## Examples
Below are some examples making use of whenTime in various situations.

#### Scheduling multiple tasks at 3:30 AM to occur one-time
```javascript
const whenTime = require('when-time');

// This is a one-time job which will execute the 2 tasks below once at 3:30 AM
whenTime.isEqualTo('3:30 AM')
.do(() => {
    console.log('This is task 1');
}).do(() => {
    console.log('This is task 2');
});
```

#### Scheduling a task to begin at 3:30 AM and repeat every 12 hours
```javascript
const whenTime = require('when-time');

whenTime.isEqualTo('3:30 AM')
.do(() => {
    console.log('This task will repeat every 12 hours');
})
.repeat()
.every('12 hours');
```

#### Scheduling a task to begin at 3:30 AM and repeat every 1 hour for a total of 12 times
```javascript
const whenTime = require('when-time');

whenTime.isEqualTo('3:30 AM')
.do(() => {
    console.log('This task will repeat every 1 hour for a total of 12 times after 3:30 AM');
})
.repeat(12)
.every('1 hour')
.whenFinished(() => {
    console.log('Successfully trigger above task 12 times');
});
```

#### Cancelling a scheduled task before execution
```javascript
const whenTime = require('when-time');

let task = whenTime.isEqualTo('3:30 AM').do(() => {
    console.log('Some task that will be cancelled');
});

// This will cancel the above task and clean up any underlying setTimeouts/setIntervals
task.cancel();
```

## TimeTask
Below is a breakdown of the `TimeTask` class generated when calling `whenTime.isEqualTo()`.

#### Constructor Options
* `time_string` [`String`]: Time string representing a target time point.
  * **Format**: `Hours:Minutes:Seconds:Milliseconds AM/PM`
  * **Examples**: `5:30 PM`, `10:30:55:850 PM`, `18:00`, `22:35:50:680`
  * **Note** 12 hour time format will only be used when `AM/PM` is specified.

#### TimeTask Properties
| Property  | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `state` | `String` | Possible States: `INITIALIZED`, `PENDING`, `STARTED`, `FINISHED`, `CANCELLED` |
| `next_execution` | `Number` | Timestamp of next execution in milliseconds |
| `tasks` | `Array` | Returns all scheduled tasks with `do(handler)` |
| `remaining` | `Number` | Number of repetitions remaining for task is finished |

#### TimeTask Methods
* `do(Function: operation)`: Adds an operation to the list of scheduled operations for a `TimeTask`.
    * **Returns** `TimeTask` therefore a chainable method.
    * **Note** operations will be executed in the order they were scheduled using this method on a `TimeTask` instance.
* `inTimezone(String: timezone)`: Specifies the timezone for the `time_string` specified at creation of task.
  * **See** [Timezones](./src/timezones.json) for supported timzones.
* `repeat(Number: amount)`: Sets the amount of times the scheduled tasks should repeat.
    * **Default**: `Infinity`
    * **Returns** `TimeTask` therefore a chainable method.
    * **Note**: `whenFinished()` is forbidden once `Infinity` repetitions have been set on an instance.
    * **Note**: Calling this method with `Infinity` amount is forbidden after a `whenFinished()` handler has been set on an instance.
* `every(String: interval)`: Specifies the interval after which repetitions should occur.
    * **Returns** `TimeTask` therefore a chainable method.
    * **Format**: `Amount Metric` where `Metric = [Day(s), Hour(s), Minute(s), Second(s), Millisecond(s)]`
    * **Note** the default repetition interval for a `TimeTask` instance is `24 Hours` without ever calling this method.
* `whenFinished(Function: handler)`: Binds a handler which is triggered once `TimeTask` execution is fully complete and all repetitions have been completed.
    * **Returns** `TimeTask` therefore a chainable method. 
    * **Note** this method is forbidden when `Infinity` amount of repetitions have been scheduled for an instance.
* `cancel()`: Cancels a `TimeTask` and destroys all underlying timeouts/intervals for a complete cleanup.
## License
[MIT](./LICENSE)