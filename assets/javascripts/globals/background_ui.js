/* BackgroundUI is a Singleton */

(function($) {
    'use strict';

    var UPDATES_PER_SECOND = 1;
    var CLOCK_KEY = 'BackgroundUI';

    var LEFT_OFFSET = 5;
    var MAX_COLUMNS = 120;

    var FONT_SIZE = 16; // font size in px
    var FONT_WIDTH = FONT_SIZE * 0.6; // for monospace font, the width is 60% of the height
    var BACKGROUND_WIDTH = MAX_COLUMNS * FONT_WIDTH;

    var INVIS_CHAR = '.';

    var BackgroundUI = function() {};

    BackgroundUI.prototype = {
        init: function() {
            var self = this;

            this.$background = $('#background-art');
            this.$overlay = $('#background-overlay');

            $('.restricted-width').css('width', BACKGROUND_WIDTH);

            Game.Timers.addTimerSupport(this);

            // Start clock
            Game.Clock.setInterval(CLOCK_KEY, function(iterations, period) {
                // Only draw once (no matter how many iterations)
                //self._refreshUI();

                self.updateTimers(iterations * period);
            }, 1.0 / UPDATES_PER_SECOND);

        },

        setZoneName: function(name) {
            $('#zone-name').html(name);
        },

        // should be called after drawBackground to attach click handlers
        registerHandler: function(key, handler) {
            this._registeredHandlers[key] = handler;
        },

        drawBackground: function(key) {
            this._resetOverlay();

            var bgRecord = Game.UI.Backgrounds[key];
            if (!bgRecord) {
                this._lastBackgroundKey = null;
                this.$background.empty();
                return;
            }

            var image = bgRecord.layout;
            var r, c, numRows = image.length, numCols;

            // Only redraw the background if it's changed since last draw
            if (key === this._lastBackgroundKey) {
                return;
            }
            this._lastBackgroundKey = key;

            // Set up an array to hold the characters
            var background = new Array(numRows);
            for (r = 0; r < numRows; r++) {
                background[r] = new Array(LEFT_OFFSET + MAX_COLUMNS).fill(' ');
            }

            // Iterate through image, unfolding doodads if necessary
            for (r = 0; r < numRows; r++) {
                var row = image[r];
                for (c = 0, numCols = row.length; c < numCols; c++) {
                    if (row[c] && row[c] !== ' ') {
                        var doodadKey = bgRecord.doodads[row[c]];
                        if (doodadKey) {
                            this._addDoodadToBackground(Game.UI.Doodads[doodadKey], r, c, background);
                        }
                        else {
                            background[r][c] = row[c];
                        }
                    }
                }
            }

            // Join the background array into a single string
            for (r = 0; r < numRows; r++) {
                background[r] = background[r].slice(LEFT_OFFSET, LEFT_OFFSET + MAX_COLUMNS).join('');// + background[r].slice(0, LEFT_OFFSET).join('');
            }

            this.$background.html(background.join('\n'));

            this._attachMouseHandlers();
        },

        _addDoodadToBackground: function(doodad, startingR, startingC, background) {
            var image = doodad.image;
            this._setupMouseover(doodad.mouseover, startingR, startingC);

            for (var r = 0, numRows = image.length; r < numRows; r++) {
                if ((startingR - numRows + r) >= 0) {
                    var row = image[r];
                    for (var c = 0, numCols = row.length; c < numCols; c++) {
                        var shouldFill = false;
                        if (doodad.fills) {
                            // Important! If no color, nothing will be drawn. This way, even an 'empty' space (no character)
                            //            can still block a doodad behind it
                            shouldFill = doodad.fills[r][c] !== ' ';
                        }
                        else {
                            shouldFill = row[c] !== ' ';
                        }

                        if (shouldFill) {
                            var classes = '';
                            if (doodad.fills && doodad.colors[doodad.fills[r][c]]) {
                                classes += doodad.colors[doodad.fills[r][c]]
                            }
                            if (doodad.mouseover) {
                                classes += (' hoverable ' + doodad.mouseover.klass);
                            }
                            var char = row[c];
                            if (doodad.fills && doodad.fills[r][c] === INVIS_CHAR) {
                                char = background[startingR - numRows + r][startingC + c]; // "invis", so make it same as original char
                            }

                            if (classes.length) {
                                background[startingR - numRows + r][startingC + c] = "<span class='"+classes+"'>"+char+"</span>";
                            }
                            else {
                                background[startingR - numRows + r][startingC + c] = char;
                            }
                        }
                    }
                }
            }
        },

        _resetOverlay: function() {
            this.$overlay.empty();
            this._mouseovers = [];
            this._registeredHandlers = {};
        },

        _setupMouseover: function(data, row, col) {
            if (data) {
                var $overlay = $('<span/>', {
                    css: {
                        top: (row - data.offset[1] - 1) * FONT_SIZE,
                        left: (col - LEFT_OFFSET + data.offset[0]) * FONT_WIDTH
                    },
                    class: data.klass,
                    html: data.label
                });

                this.$overlay.append($overlay);

                this._mouseovers.push($.extend({}, data, { $overlay: $overlay }));
            }
        },

        _attachMouseHandlers: function() {
            var self = this;

            this._mouseovers.forEach(function(data) {
                var $background = self.$background.add(self.$overlay);

                $background.off('mouseenter', '.'+data.klass).on('mouseenter', '.'+data.klass, function() {
                    data.$overlay.show();
                });
                $background.off('mouseout', '.'+data.klass).on('mouseout', '.'+data.klass, function() {
                    data.$overlay.hide();
                });
                $background.off('click', '.'+data.klass).on('click', '.'+data.klass, function() {
                    if (self._registeredHandlers[data.handler]) {
                        self._registeredHandlers[data.handler]();
                    }
                    else {
                        console.warn('No handler found for: ', data.handler);
                    }
                });
            });
        },


    };

    Game.BackgroundUI = new BackgroundUI();


}(jQuery));
