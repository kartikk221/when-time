const conversion = {
    day: 1000 * 60 * 60 * 24,
    hour: 1000 * 60 * 60,
    minute: 1000 * 60,
    second: 1000,
    millisecond: 1,
};

const conversionKeys = Object.keys(conversion);

class TimeTask {
    #time_point;
    #timeout;
    #interval;
    #tasks = [];
    #repeat_interval = conversion.day; // Default is 24 hours
    #repeat_count = 0;
    #state = 'INITIALIZED'; // [INITIALIZED, PENDING, STARTED, FINISHED, CANCELLED]
    #finish_handler;

    constructor(time_string) {
        this.#time_point = this._parse_time_string(time_string);
    }

    /**
     * Adds task to TimeTask to be executed upon specified time.
     *
     * @param {Function} task
     */
    do(task) {
        // Ensure task is a function type
        if (typeof task !== 'function')
            throw new Error('.do(task) -> task must be a Function');

        // Ensure task is not already started
        if (this.#state !== 'INITIALIZED' && this.#state !== 'PENDING')
            throw new Error(
                'You cannot do() more work once a TimeTask has been started or CANCELLED.'
            );

        // Queue the task for future execution
        this.#tasks.push(task);
        this._schedule();
        return this;
    }

    /**
     * Makes current TimeTask repeat specified amount of times. Note! this method is only available for isEqualTo time tasks.
     *
     * @param {Number} amount
     */
    repeat(amount = Infinity) {
        // Do not allow repetitions if a finish handler has been set
        if (this.#finish_handler && amount === Infinity)
            throw new Error(
                'repeat(amount) -> This method is not allowed after setting a whenFinished() handler.'
            );

        this.#repeat_count = amount;
        return this;
    }

    /**
     * Makes current TimeTask repeat after specified interval
     *
     * @param {String} interval_string
     */
    every(interval_string) {
        let milliseconds = this._parse_interval_string(interval_string);
        this.#repeat_interval = milliseconds;
        return this;
    }

    whenFinished(handler) {
        // Only allow function type handler
        if (typeof handler !== 'function')
            throw new Error(
                'whenFinished(handler) -> handler must be a Function.'
            );

        // Do not allow whenFinished to be set if repetitions are enabled
        if (this.#repeat_count === Infinity)
            throw new Error(
                'whenFinished(handler) -> This function will never finish as it has infinite repeats scheduled.'
            );

        this.#finish_handler = handler;
        return this;
    }

    /**
     * Stops current TimeTask and cleans up any associated timeouts or intervals.
     * Instance can successfully be cleaned up after being CANCELLED.
     */
    cancel() {
        this._finish('CANCELLED');
    }

    /**
     * Wraps input number inside the specified limit number
     *
     * @param {Number} input
     * @param {Number} limit
     * @returns {Number} Number
     */
    _wrap_number(input, limit) {
        return input > limit
            ? input % limit
            : input < 0
            ? (input % limit) + limit
            : input;
    }

    /**
     * Parses time string into an object of hours, minutes, seconds and milliseconds.
     *
     * @param {String} time_string
     * @returns {Object} Object
     */
    _parse_time_string(time_string) {
        // Ensure time_string is a string
        if (typeof time_string !== 'string')
            throw new Error('time_string must be a string type');

        // Enforce lowercase time_string format
        time_string = time_string.toLowerCase();

        // Determine timeslot for the time format
        let isPM = time_string.endsWith(' pm');

        // Parse the pre-chunk of a date
        let pre_chunk = time_string.split(' ')[0];
        if (pre_chunk.indexOf(':') > -1) {
            let chunks = pre_chunk.split(':');
            let hours = +chunks[0];
            if (chunks.length > 0 && !isNaN(hours)) {
                // Wrap hours to a maximum of 24 hours
                hours = this._wrap_number(hours, 24);

                // Relativize 12 hour format into a 24 hour format
                if (hours < 12 && isPM) hours += 12;

                // Return wrapped breakdown of the time point in 24 hour format
                return {
                    hours: hours,
                    minutes: this._wrap_number(+(chunks[1] || 0), 60),
                    seconds: this._wrap_number(+(chunks[2] || 0), 60),
                    milliseconds: this._wrap_number(+(chunks[3] || 0), 1000),
                };
            }
        }

        // Throw error on failed parsing
        throw new Error(
            'time_string is not a valid time string. Must be Hours:Minutes:Seconds:Milliseconds AM/PM'
        );
    }

    /**
     * Parses human readable interval string into the milliseconds amount.
     *
     * @param {String} interval_string
     * @returns {Number} Milliseconds
     */
    _parse_interval_string(interval_string) {
        let chunks = interval_string.split(' ');
        if (chunks.length == 2) {
            let amount = +chunks[0];
            let metric = chunks[1].toLowerCase();
            if (!isNaN(amount)) {
                let valid_metric = false;
                conversionKeys.forEach((key) => {
                    if (metric.startsWith(key)) {
                        valid_metric = true;
                        amount *= conversion[key];
                    }
                });
                if (valid_metric) return amount;
            }
        }

        throw new Error(
            'Invalid interval_string. Please specify a time string such as "5 hours" or "10 seconds"'
        );
    }

    /**
     * Returns current time point.
     *
     * @returns {Object} Object
     */
    _current_time() {
        let date = new Date();
        return {
            hours: date.getHours(),
            minutes: date.getMinutes(),
            seconds: date.getSeconds(),
            milliseconds: date.getMilliseconds(),
        };
    }

    /**
     * Returns difference between two time points.
     *
     * @param {Object} p1
     * @param {Object} p2
     * @returns {Object} Time Point
     */
    _point_difference(p1, p2) {
        let difference = {
            hours: this._wrap_number(p2.hours - p1.hours, 24),
            minutes: p2.minutes - p1.minutes,
            seconds: p2.seconds - p1.seconds,
            milliseconds: p2.milliseconds - p1.milliseconds,
        };

        // Determine difference in milliseconds
        let difference_msecs = this._point_to_milliseconds(difference);

        // Wrap around difference by 24 hours if current window is missed
        if (difference.hours == 0 && difference_msecs < 0)
            difference.hours += 24;

        return difference;
    }

    /**
     * Converts time point into milliseconds.
     *
     * @param {Object} point
     * @returns {Number}
     */
    _point_to_milliseconds(point) {
        return (
            point.hours * conversion.hour +
            point.minutes * conversion.minute +
            point.seconds * conversion.second +
            point.milliseconds * conversion.millisecond
        );
    }

    /**
     * Converts milliseconds to time point.
     *
     * @param {Number} milliseconds
     * @returns {Object} Object
     */
    _milliseconds_to_point(milliseconds) {
        // Calculate Hours
        let hours = Math.floor(milliseconds / conversion.hour);
        if (hours > 0) milliseconds -= hours * conversion.hour;

        // Calculate Minutes
        let minutes = Math.floor(milliseconds / conversion.minute);
        if (minutes > 0) milliseconds -= minutes * conversion.minute;

        // Calculate Seconds
        let seconds = Math.floor(milliseconds / conversion.second);
        if (seconds > 0) milliseconds -= seconds * conversion.second;

        return {
            hours: hours,
            minutes: minutes,
            seconds: seconds,
            milliseconds: milliseconds,
        };
    }

    /**
     * Returns the offset in milliseconds till next execution time.
     *
     * @returns {Number}
     */
    _execution_offset() {
        let current = this._current_time();
        let future = this.#time_point;
        let current_msecs = this._point_to_milliseconds(current);
        let future_msecs = this._point_to_milliseconds(future);

        // Return milliseconds till next time hit
        if (current_msecs < future_msecs) {
            return future_msecs - current_msecs;
        } else {
            return conversion.day - current_msecs + future_msecs;
        }
    }

    /**
     * Schedules the first task execution based on offset to next time point
     */
    _schedule() {
        // Do not reschedule once TimeTask is in pending state
        if (this.#state == 'PENDING') return;

        // Create a timeout with determined offset to perform first execution
        let offset = this._execution_offset();
        this.#state = 'PENDING';
        this.#timeout = setTimeout(
            (reference) => {
                reference._execute(true);
                reference.#timeout = undefined;
            },
            offset,
            this
        );
    }

    /**
     * Repeats time task execution and offsets pending repetitions.
     */
    _repeat() {
        // Execute all tasks
        this._execute();

        // Calculate if more repetitions are pending and finish if no more pending repetitions remain
        this.#repeat_count--;
        if (this.#repeat_count < 1 && this.#state == 'STARTED') this._finish();
    }

    /**
     * Performs Time Task execution and repeats if neccessary
     */
    _execute(first_time = false) {
        // Handle first time execution for future setup
        if (first_time) {
            // Update the task state to started upon first execution
            this.#state = 'STARTED';

            // Bind interval to repeat task if repetitions are specified
            if (this.#repeat_count > 1) {
                this.#repeat_count--;
                this.#interval = setInterval(
                    (ref) => ref._repeat(),
                    this.#repeat_interval,
                    this
                );
            }
        }

        // Execute all instance tasks
        this.#tasks.forEach((task) => task());

        // Finish after first execution if no repetitions are pending
        if (this.#repeat_count < 1) this._finish();
    }

    /**
     * Destroys current TimeTask instance and removes any underlying intervals/timeouts.
     *
     * @param {String} state
     */
    _finish(state = 'FINISHED') {
        if (this.#timeout) clearTimeout(this.#timeout);
        if (this.#interval) clearInterval(this.#interval);
        this.#tasks = [];
        this.#state = state;

        // Trigger finish handler if state is finished
        if (state === 'FINISHED' && this.#finish_handler)
            this.#finish_handler();
    }

    /* TimeTask Getters */
    get tasks() {
        return this.#tasks;
    }

    get remaining() {
        return this.#repeat_count;
    }

    get state() {
        return this.#state;
    }
}

module.exports = TimeTask;
