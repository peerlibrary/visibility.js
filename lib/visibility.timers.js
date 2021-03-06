;(function () {
    "use strict";

    var defined = function(variable) {
        return ('undefined' != typeof(variable));
    };

    var self = Visibility;

    var timers = {

        // Run callback every `interval` milliseconds if page is visible and
        // every `hiddenInterval` milliseconds if page is hidden.
        //
        //   Visibility.every(60 * 1000, 5 * 60 * 1000, function () {
        //       checkNewMails();
        //   });
        //
        // You can skip `hiddenInterval` and callback will be called only if
        // page is visible.
        //
        //   Visibility.every(1000, function () {
        //       updateCountdown();
        //   });
        //
        // It is analog of `setInterval(callback, interval)` but use visibility
        // state.
        //
        // It return timer ID, that you can use in `Visibility.stop(id)` to stop
        // timer (`clearInterval` analog).
        // Warning: timer ID is different from interval ID from `setInterval`,
        // so don’t use it in `clearInterval`.
        //
        // On change state from hidden to visible timers will be execute.
        every: function (interval, hiddenInterval, callback) {
            self._time();

            if ( !defined(callback) ) {
                callback = hiddenInterval;
                hiddenInterval = null;
            }

            self._lastTimer += 1;
            var number = self._lastTimer;

            self._timers[number] = {
                visible:  interval,
                hidden:   hiddenInterval,
                callback: callback
            };
            self._run(number, false);

            if ( self.isSupported() ) {
                self._listen();
            }
            return number;
        },

        // Stop timer from `every` method by it ID (`every` method return it).
        //
        //   slideshow = Visibility.every(5 * 1000, function () {
        //       changeSlide();
        //   });
        //   $('.stopSlideshow').click(function () {
        //       Visibility.stop(slideshow);
        //   });
        stop: function(id) {
            var timer = self._timers[id]
            if ( !defined(timer) ) {
                return false;
            }
            self._stop(id);
            delete self._timers[id];
            return timer;
        },

        // Last timer number.
        _lastTimer: -1,

        // Callbacks and intervals added by `every` method.
        _timers: { },

        // Is setInterval method detected and listener is binded.
        _timed: false,

        // Initialize variables on page loading.
        _time: function () {
            if ( self._timed ) {
                return;
            }
            self._timed = true;

            self.change(function () {
                self._stopRun()
            });
        },

        // Try to run timer from every method by it’s ID. It will be use
        // `interval` or `hiddenInterval` depending on visibility state.
        // If page is hidden and `hiddenInterval` is null,
        // it will not run timer.
        //
        // Argument `runNow` say, that timers must be execute now too.
        _run: function (id, runNow) {
            var interval,
                timer = self._timers[id];
            if ( self.hidden() ) {
                if ( null === timer.hidden ) {
                    return;
                }
                interval = timer.hidden;
            } else {
                interval = timer.visible;
            }

            var runner = function () {
                timer.last = new Date();
                timer.callback.call(window);
            }

            if ( runNow ) {
                var now  = new Date();
                var last = now - timer.last ;

                if ( interval > last ) {
                    timer.delay = setTimeout(function () {
                        runner();
                        timer.id = setInterval(runner, interval);
                    }, interval - last);
                } else {
                    runner();
                    timer.id = setInterval(runner, interval);
                }

            } else {
              timer.id = setInterval(runner, interval);
            }
        },

        // Stop timer from `every` method by it’s ID.
        _stop: function (id) {
            var timer = self._timers[id];
            clearInterval(timer.id);
            clearTimeout(timer.delay);
            delete timer.id;
            delete timer.delay;
        },

        // Listener for `visibilitychange` event.
        _stopRun: function (event) {
            var isHidden  = self.hidden(),
                wasHidden = self._wasHidden;

            if ( (isHidden && !wasHidden) || (!isHidden && wasHidden) ) {
                for ( var i in self._timers ) {
                    self._stop(i);
                    self._run(i, !isHidden);
                }
            }
        }

    };

    for ( var prop in timers ) {
        Visibility[prop] = timers[prop];
    }

})();
