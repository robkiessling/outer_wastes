/* UserInterface is a Singleton */

(function($) {
    'use strict';

    var UPDATES_PER_SECOND = 15;
    var CLOCK_KEY = 'UserInterface';

    var MAX_UNIT_FRAMES = 5;

    /*
        Cast bar / cooldown spinners need high framerates so they can increment smoothly (don't want to tie it to
        normal UPDATES_PER_SECOND because they need at least 60fps). So we start up new Clock intervals when needed.

        Note: Since the animation is just spun off (it's not tied to the actual ability), if we implement things like:
        - getting hit slows down a cast by 0.5 seconds
        - reducing ability cooldowns by 1s (e.g. Ezreal Q)
        We will have to restart the animation (at a partially done state) when the events occur.
     */
    var CAST_BAR_CLOCK_KEY = 'CastBar';
    var CAST_BAR_UPDATES_PER_SECOND = 100; // Needs high frame rate to smoothly increment
    var COOLDOWN_UPDATES_PER_SECOND = 60;  // Needs high frame rate to smoothly increment

    var DRAW_COOLDOWN_LINES = false; // Whether to draw two white lines on cooldown timers (like clock hands)

    var HIGHLIGHT_INSTANT_DURATION = 200; // How long to highlight ability buttons for instant cast abilities

    var COMBAT_TEXT_DURATION = 1500; // should match animation-duration in scss
    var COMBAT_TEXT_OFFSET_WINDOW = 1000; // if two texts are shown within this time, offset the second text


    var UserInterface = function() {};

    UserInterface.prototype = {
        init: function() {
            var self = this;

            this._initFrames();
            this._initCastBar();
            this._initAbilityBar();
            this._initPlayerBars();
            this._initEffects();
            this._initLevelUI();

            // Start clock
            Game.Clock.setInterval(CLOCK_KEY, function(iterations, period) {
                // Only draw once (no matter how many iterations)
                self._refreshUnitFrames();
                self._refreshPlayerBars();
                self._refreshAbilityBar();
                self._refreshAbilityTooltip();
            }, 1.0 / UPDATES_PER_SECOND);
        },




        // ----------------------------------------------------- Unit frames

        _initFrames: function() {
            var $allyFramesContainer = $('#ally-frames');
            var $enemyFramesContainer = $('#enemy-frames');
            var $allyTemplate = $('#ally-frame-template');
            var $enemyTemplate = $('#enemy-frame-template');

            this._allyFrames = [];
            this._enemyFrames = [];

            this._allyIndices = {}; // Mapping of unit id -> array index of unit
            this._enemyIndices = {}; // Mapping of unit id -> array index of unit

            for (var i = 0; i < MAX_UNIT_FRAMES; i++) {
                this._allyFrames.push(this._createFrame($allyFramesContainer, $allyTemplate, Game.Constants.teamIds.player, i));
                this._enemyFrames.push(this._createFrame($enemyFramesContainer, $enemyTemplate, Game.Constants.teamIds.computer, i));
            }

            this._setupFrameKeybinds();
        },

        _createFrame: function($container, $template, teamId, index) {
            var self = this;

            var $frame = $template.clone();
            $frame.removeAttr('id');
            $frame.appendTo($container);

            $frame.find('.health-area').off('click').on('click', function() {
                self.targetIndex(teamId, index);
            });

            var $healthBar = $frame.find('.health-bar');
            var $manaBar = $frame.find('.mana-bar');
            var $castBar = $frame.find('.cast-bar');

            // Cache jquery references to elements that will need constant updating
            return {
                $frame: $frame,
                $name: $frame.find('.unit-name'),
                $portraitArea: $frame.find('.portrait-area'),
                $effectsArea: $frame.find('.effects-area'),
                $healthArea: $frame.find('.health-area'),

                $healthBarProgress: $healthBar.find('.bar-layer.health'),
                $healthBarShield: $healthBar.find('.bar-layer.shield'),
                $healthBarText: $healthBar.find('.bar-layer.bar-text'),

                $manaBar: $manaBar,
                $manaBarProgress: $manaBar.find('.bar-layer.mana'),
                $manaBarText: $manaBar.find('.bar-layer.bar-text'),

                $castBar: $castBar,
                $castBarProgress: $castBar.find('.bar-layer.cast-progress'),
                $castBarText: $castBar.find('.bar-layer.bar-text'),

                combatTextOffsets: {}
            };
        },

        // Returns the frame object (object with jquery references) for a unit
        _frameForUnit: function(unit) {
            if (unit.teamId === Game.Constants.teamIds.player) {
                return this._allyFrames[this._allyIndices[unit.id]];
            }
            else {
                return this._enemyFrames[this._enemyIndices[unit.id]];
            }
        },

        _setupFrameKeybinds: function() {
            var self = this;

            // -------- Can use keyboard arrow keys to target units:

            function targetFirstAlly() {
                self.targetIndex(Game.Constants.teamIds.player, 0);
            }

            // UP arrow
            Game.Keyboard.registerKey(38, function() {
                var index = Game.UnitEngine.indexOfUnit(self._targetedUnit);
                if (index === null) {
                    targetFirstAlly();
                }
                else {
                    // target previous unit in same team
                    if (index > 0) {
                        self.targetIndex(self._targetedUnit.teamId, index - 1);
                    }
                }
            });

            // DOWN arrow
            Game.Keyboard.registerKey(40, function() {
                var index = Game.UnitEngine.indexOfUnit(self._targetedUnit);
                if (index === null) {
                    targetFirstAlly();
                }
                else {
                    // target next unit in same team
                    var units = Game.UnitEngine.unitsForTeam(self._targetedUnit.teamId);
                    if (index < (units.length - 1)) {
                        self.targetIndex(self._targetedUnit.teamId, index + 1);
                    }
                }
            });

            // LEFT arrow
            Game.Keyboard.registerKey(37, function() {
                var index = Game.UnitEngine.indexOfUnit(self._targetedUnit);
                if (index === null) {
                    targetFirstAlly();
                }
                else {
                    // target player unit of same index
                    var units = Game.UnitEngine.unitsForTeam(Game.Constants.teamIds.player);
                    if (index >= units.length) {
                        index = units.length - 1; // In case computer had more units than player
                    }
                    self.targetIndex(Game.Constants.teamIds.player, index);
                }
            });

            // RIGHT arrow
            Game.Keyboard.registerKey(39, function() {
                var index = Game.UnitEngine.indexOfUnit(self._targetedUnit);
                if (index === null) {
                    targetFirstAlly();
                }
                else {
                    // target computer unit of same index
                    var units = Game.UnitEngine.unitsForTeam(Game.Constants.teamIds.computer);
                    if (index >= units.length) {
                        index = units.length - 1; // In case player had more units than computer
                    }
                    self.targetIndex(Game.Constants.teamIds.computer, index);
                }
            });
        },


        loadTeam: function(teamId) {
            var self = this;

            if (teamId === Game.Constants.teamIds.player) {
                this._allyFrames.forEach(function(frame) {
                    frame.$frame.invisible();
                });
                this._allyIndices = {}; // Mapping of unit id -> array index of unit
                Game.UnitEngine.unitsForTeam(teamId).forEach(function(unit, index) {
                    self._allyIndices[unit.id] = index;
                    self._loadUnitIntoFrame(unit);
                });
            }
            else {
                this._enemyFrames.forEach(function(frame) {
                    frame.$frame.invisible();
                });
                this._enemyIndices = {}; // Mapping of unit id -> array index of unit
                Game.UnitEngine.unitsForTeam(teamId).forEach(function(unit, index) {
                    self._enemyIndices[unit.id] = index;
                    self._loadUnitIntoFrame(unit);
                });
            }

            this.updateCombatStatus();
        },

        _loadUnitIntoFrame: function(unit) {
            var self = this;

            var frame = this._frameForUnit(unit);
            frame.$name.html(unit.name);

            frame.$manaBar.toggle(unit.maxMana.value() !== null);
            //frame.$manaBar.toggle(false);

            // load existing effects:
            Game.Util.iterateObject(unit.effects(), function(effectId, effect) {
                self.addEffect(unit, effect);
            });

            frame.$frame.visible();
        },

        _refreshUnitFrames: function() {
            var self = this;

            Game.UnitEngine.unitsForTeam(Game.Constants.teamIds.player).forEach(function(ally) {
                self._refreshUnitFrame(ally);
            });
            Game.UnitEngine.unitsForTeam(Game.Constants.teamIds.computer).forEach(function(enemy) {
                self._refreshUnitFrame(enemy);
            });
        },

        _refreshUnitFrame: function(unit) {
            var frame = this._frameForUnit(unit);

            var healthPercent = unit.percentHealth() + '%';
            frame.$healthBarProgress.css('width', healthPercent);
            frame.$healthBarText.html(Game.Util.round(unit.health) + '/' + Game.Util.round(unit.maxHealth.value()));

            if (unit.totalAbsorb() > 0) {
                var shieldPercent = Game.Util.roundForComparison((unit.health + unit.totalAbsorb()) / unit.maxHealth.value()) * 100 + '%';
                frame.$healthBarShield.css('width', shieldPercent).addClass('active');
            }
            else {
                frame.$healthBarShield.css('width', 0).removeClass('active');
            }

            if (unit.maxMana.value() !== null) {
                var manaPercent = unit.percentMana() + '%';
                frame.$manaBarProgress.css('width', manaPercent);
                frame.$manaBarText.html(Game.Util.round(unit.mana) + '/' + Game.Util.round(unit.maxMana.value()));
            }
        },

        unitDied: function(unit) {
            this._refreshAbilityTargets();
        },

        createFloatingText: function(unit, text, textClass) {
            var frame = this._frameForUnit(unit);
            var $portraitArea = frame.$portraitArea;

            // If two combat texts are shown (for the same unit) within the COMBAT_TEXT_OFFSET_WINDOW, offset one to the side
            var oldOffsetData = frame.combatTextOffsets;
            var now = Date.now() || (new Date).getTime();
            var isOffset = oldOffsetData && !oldOffsetData.isOffset && (now - oldOffsetData.time < COMBAT_TEXT_OFFSET_WINDOW);
            frame.combatTextOffsets = {
                time: now,
                isOffset: isOffset
            };

            var $text = $('<span class="combat-text ' + textClass + ' + ' + (isOffset ? 'offset' : '') + '">' + text + '</span>').appendTo($portraitArea);
            window.setTimeout(function() {
                $text.remove();
            }, COMBAT_TEXT_DURATION);
        },





        // ----------------------------------------------------- Targeting


        targetedUnit: function() {
            return this._targetedUnitOverride ? this._targetedUnitOverride : this._targetedUnit;
        },

        clearTarget: function() {
            this._targetedUnit = null;
            $('.health-area').removeClass('targeted');

            this._refreshAbilityTargets();
        },

        targetUnit: function(unit) {
            // Remove targeting circle from any old target. Note: Not calling clearTarget for small performance gain
            this._targetedUnit = unit;
            $('.health-area').removeClass('targeted');

            // Add targeting circle to new target
            this._frameForUnit(unit).$healthArea.addClass('targeted');

            this._refreshAbilityTargets();
        },

        targetIndex: function(teamId, index) {
            this.targetUnit(Game.UnitEngine.unitsForTeam(teamId)[index]);
        },

        // Targets a unit but doesn't show the white targeting circle around the unit in the UI. Used for things like alt-self-casting.
        overrideTargetUnit: function(unit) {
            this._targetedUnitOverride = unit;
            this._refreshAbilityTargets();
        },

        clearTargetOverride: function() {
            this._targetedUnitOverride = null;
            this._refreshAbilityTargets();
        },







        // ----------------------------------------------------- Level UI

        _initLevelUI: function() {
            this._$navigationPanel = $('#navigation-panel');
            this._$engageCombat = this._$navigationPanel.find('#engage-combat');
            this._$nextRoom = this._$navigationPanel.find('#next-room');
            this._$engageCombat.off('click').on('click', function(evt) {
                evt.preventDefault();
                Game.UnitEngine.enterCombat();
            });

            this._$navigationPanel.find('.restart').off('click').on('click', function(evt) {
                location.reload();
            });

            this._$nextRoom.off('click').on('click', function(evt) {
                evt.preventDefault();
                Game.Levels.currentLevel.loadRandomEnemyRoom();
            })

        },

        updateCombatStatus: function() {
            this._$engageCombat.prop('disabled', Game.UnitEngine.inCombat() || !Game.UnitEngine.isComputerTeamAlive());
            this._$nextRoom.toggleClass('invisible', Game.UnitEngine.isComputerTeamAlive());

            if (!Game.UnitEngine.isPlayerTeamAlive()) {
                this._$navigationPanel.find('.normal-navigation').hide();
                $('.game-over').show();
            }
        },

        newRoomLoaded: function(room) {
            var level = Game.Levels.currentLevel;
            $('#level-info').html(level.name + '&emsp;&mdash;&emsp; Room ' + level.currentRoomIndex() + ' / ' + level.numRooms);
        },






        // ----------------------------------------------------- Effects

        _initEffects: function() {
            this._effects = {}; // Effect id -> effect object containing jquery / CooldownTimer references
        },

        addEffect: function(unit, effect) {
            var frame = this._frameForUnit(unit);

            // Unit may not have been loaded into UI yet. That's okay, when it is its effects will be loaded
            if (!frame) {
                return;
            }

            var $effectsArea = frame.$effectsArea;

            var $effect = $('<div></div>', {
                class: 'effect ' + effect.icon + ' ' + effect.background + ' ' + (effect.hidden ? 'hidden' : '')
            }).appendTo($effectsArea);

            if (unit.teamId === Game.Constants.teamIds.player) {
                $effect.prependTo($effectsArea);
            }
            else {
                $effect.appendTo($effectsArea);
            }

            $('<canvas></canvas>', {
                class: 'cooldown-status'
            }).appendTo($effect);

            var timer = new CooldownTimer($effect, 'Effect_'+effect.id, true);

            if (effect.hasDuration) {
                var totalCooldown = effect.duration.value();
                var elapsed = totalCooldown - effect.durationLeft();
                timer.startCooldown(totalCooldown, elapsed);
            }

            this._effects[effect.id] = {
                $effect: $effect,
                timer: timer
            };
        },

        removeEffect: function(unit, effect) {
            this._effects[effect.id].$effect.remove();
            delete this._effects[effect.id];
        },

        // Refresh an existing effect so it stays in the same place (won't jump to end of $effectsArea)
        refreshEffect: function(unit, oldEffect, newEffect) {
            this._effects[newEffect.id] = this._effects[oldEffect.id];
            delete this._effects[oldEffect.id];

            if (newEffect.hasDuration) {
                var totalCooldown = newEffect.duration.value();
                var elapsed = totalCooldown - newEffect.durationLeft();
                this._effects[newEffect.id].timer.startCooldown(totalCooldown, elapsed);
            }
        },







        // ----------------------------------------------------- Ability Bar

        _initAbilityBar: function() {
            var self = this;

            // Esc key (cancel cast)
            Game.Keyboard.registerKey(27, function() {
                Game.Player.cancelCast('Interrupted');
            });

            // alt key (self cast modifier)
            Game.Keyboard.registerKey(18, function() {
                // With this here we can immediately update ability target requirements as soon as alt is pressed
                self.overrideTargetUnit(Game.Player);
            }, function() {
                // Note: Can't depend on catching this (e.g. hold alt then switch to another window)
                //       So we also clear override if altKey is not pressed during actual ability click
                self.clearTargetOverride();
            });

            this._$abilityButtons = {}; // ability id -> $button
            this._abilityCooldowns = {}; // ability id -> CooldownTimer

            var $abilityTooltip = $('#ability-tooltip');
            this._abilityTooltip = {
                ability: null,
                $tip: $abilityTooltip,
                $name: $abilityTooltip.find('.name'),
                $manaCost: $abilityTooltip.find('.mana-cost'),
                $castTime: $abilityTooltip.find('.cast-time'),
                $cooldown: $abilityTooltip.find('.cooldown'),
                $cooldownRemaining: $abilityTooltip.find('.cooldown-remaining'),
                $description: $abilityTooltip.find('.description')
            };
        },

        startCooldown: function(ability, totalCooldown, elapsed) {
            this._abilityCooldowns[ability.id].startCooldown(totalCooldown, elapsed);
        },

        // TODO clean this code up... it's messy right now to handle empty slots
        assignAbilityToBar: function(ability, index) {
            var self = this;

            var $button = $('#ability-bar').find('.action-bar-button:nth-child('+(index + 1)+')'); // nth-child is 1-based

            if (ability) {
                this._$abilityButtons[ability.id] = $button;

                //$button.find('.spell-name').html(ability.name);
                $button.removeClass('blank');
                $button.addClass(ability.icon);
                $button.addClass(ability.background);
            }

            // Cast the ability, taking the mouse/button evt into account
            function castAbilityWithEvt(evt) {
                if (ability) {
                    if (self._targetedUnitOverride && !evt.altKey) {
                        self.clearTargetOverride(); // Backup catch - in case alt key was released in other window
                    }
                    Game.Player.castAbility(ability.id, self.targetedUnit());
                }
            }

            $button.off('click').on('click', function(evt) {
                castAbilityWithEvt(evt);
            });
            // TODO _toggleButtonPressed on mousedown/mouseup (like keyboard)... but mouseup isn't called if you drag off the button

            var keyCode = this._keyCodeForAbilityIndex(index);
            if (keyCode !== null) {
                Game.Keyboard.registerKey(keyCode, function(evt) {
                    castAbilityWithEvt(evt);
                    self._toggleButtonPressed($button, true);
                }, function(evt) {
                    self._toggleButtonPressed($button, false);
                });
            }

            if (ability) {
                this._abilityCooldowns[ability.id] = new CooldownTimer($button, 'Ability_'+ability.id);

                $button.off('mouseenter').on('mouseenter', function(evt) {
                    self._showAbilityTooltip(ability);
                });
                $button.off('mouseleave').on('mouseleave', function(evt) {
                    self._hideAbilityTooltip();
                });
            }

        },

        // todo removeAbilityFromBar... delete $abilityButton and abilityCooldown

        // Note: ability cooldown timers are handled separately
        _refreshAbilityBar: function() {
            var self = this;

            // refreshes if buttons disabled or not based on mana
            Game.Util.iterateObject(this._$abilityButtons, function(abilityId, $button) {
                var ability = Game.Player.abilities()[abilityId];
                self._toggleAbilityManaReq(ability, !Game.Player.hasManaForAbility(ability));
            });
        },
        
        _refreshAbilityTargets: function() {
            var self = this;

            // refreshes if buttons are disabled or not based on target
            Game.Util.iterateObject(this._$abilityButtons, function(abilityId, $button) {
                var ability = Game.Player.abilities()[abilityId];
                self._toggleAbilityTargetReq(ability, !ability.canTargetUnit(self.targetedUnit()));
            });
        },

        _keyCodeForAbilityIndex: function(index) {
            switch(index) {
                case 0:
                    return 49;
                case 1:
                    return 50;
                case 2:
                    return 51;
                case 3:
                    return 52;
                case 4:
                    return 53;
                case 5:
                    return 54;
                default:
                    return null;
            }
        },

        _toggleButtonPressed: function($button, isPressed) {
            $button.toggleClass('pressed', isPressed);
        },

        _toggleAbilityCasting: function(ability, isCasting) {
            this._$abilityButtons[ability.id].toggleClass('casting', isCasting);
        },

        _toggleAbilityManaReq: function(ability, notEnoughMana) {
            this._$abilityButtons[ability.id].toggleClass('not-enough-mana', notEnoughMana);
        },

        _toggleAbilityTargetReq: function(ability, invalidTarget) {
            this._$abilityButtons[ability.id].toggleClass('invalid-target', invalidTarget);
        },

        _showAbilityTooltip: function(ability) {
            this._abilityTooltip.ability = ability;
            this._refreshAbilityTooltip();
            this._abilityTooltip.$tip.show();
        },

        _hideAbilityTooltip: function() {
            this._abilityTooltip.ability = null; // null out ability so tooltip stops refreshing
            this._abilityTooltip.$tip.hide();
        },

        _refreshAbilityTooltip: function() {
            var ability = this._abilityTooltip.ability;
            if (!ability) {
                return;
            }

            this._abilityTooltip.$name.html(ability.name);

            var manaCost = (ability.manaCost.value() === 0) ? '' : (Game.Util.round(ability.manaCost.value()) + ' Mana');
            this._abilityTooltip.$manaCost.html(manaCost);

            var castTime = (ability.castTime.value() === 0) ? 'Instant' : (Game.Util.roundToDecimal(ability.castTime.value(), 2) + ' sec cast');
            this._abilityTooltip.$castTime.html(castTime);

            var cooldown = (ability.cooldown.value() === 0) ? '' : (Game.Util.roundToDecimal(ability.cooldown.value(), 2) + ' sec cooldown');
            this._abilityTooltip.$cooldown.html(cooldown);

            var cooldownRemaining = ability.isReady() ? '' : ('Cooldown remaining: ' + Game.Util.round(ability.remainingCooldown()) + ' sec');
            this._abilityTooltip.$cooldownRemaining.html(cooldownRemaining);

            this._abilityTooltip.$description.html(ability.description());
        },





        // ----------------------------------------------------- Player Bars (health/mana in bottom left)

        _initPlayerBars: function() {
            //var $health = $('#player-health');
            //this._playerHealth = {
            //    $progress: $health.find('.health'),
            //    $text: $health.find('.bar-text')
            //};

            var $mana = $('#player-mana');
            this._playerMana = {
                $progress: $mana.find('.mana'),
                $text: $mana.find('.bar-text')
            };
        },

        _refreshPlayerBars: function() {
            //var healthWidth = Game.Util.roundForComparison(Game.Player.health / Game.Player.maxHealth.value()) * 100 + '%';
            //this._playerHealth.$progress.css('width', healthWidth);
            //this._playerHealth.$text.html(Game.Util.round(Game.Player.health) + '/' + Game.Util.round(Game.Player.maxHealth.value()));

            var widthPercent = Game.Util.roundForComparison(Game.Player.mana / Game.Player.maxMana.value()) * 100 + '%';
            this._playerMana.$progress.css('width', widthPercent);
            this._playerMana.$text.html(Game.Util.round(Game.Player.mana) + '/' + Game.Util.round(Game.Player.maxMana.value()));
        },








        // ----------------------------------------------------- Cast bar

        _initCastBar: function() {

        },

        startCast: function(unit, ability) {
            var self = this;
            
            var castLength = ability.castTime.value();
            if (castLength !== 0) {
                // Has cast time; show cast bar, highlight ability if player
                this._startCastBar(unit, ability.name, castLength);
                if (unit.id === Game.Player.id) {
                    this._toggleAbilityCasting(ability, true);
                }
            }
            else {
                // Instant cast; briefly highlight ability if player even though it was instant cast
                if (unit.id === Game.Player.id) {
                    this._toggleAbilityCasting(ability, true);
                    window.setTimeout(function() {
                        self._toggleAbilityCasting(ability, false);
                    }, HIGHLIGHT_INSTANT_DURATION);
                }
            }
        },

        cancelCast: function(unit, ability, message) {
            this._cancelCastBar(unit, message);
            if (unit.id === Game.Player.id) {
                this._toggleAbilityCasting(ability, false);
            }
        },

        finishCast: function(unit, ability) {
            this._completeCastBar(unit);
            if (unit.id === Game.Player.id) {
                this._toggleAbilityCasting(ability, false);
            }
        },

        _startCastBar: function(unit, text, castLength) {
            var frame = this._frameForUnit(unit);

            // Set up a temporary interval for the cast bar that updates at a very high framerate
            var accumulatedSeconds = 0;
            Game.Clock.setInterval(CAST_BAR_CLOCK_KEY + '_' + unit.id, function(iterations, period) {
                accumulatedSeconds += iterations * period;
                frame.$castBarProgress.css('width', (accumulatedSeconds / castLength) * 100 + '%');
            }, 1.0 / CAST_BAR_UPDATES_PER_SECOND);

            frame.$castBarProgress.css('width', '0%')
                .removeClass('casting cast-complete cast-canceled')
                .addClass('casting');
            frame.$castBarText.html(text);
            frame.$castBar.stop(); // stop any fade out animations (from completes/cancels right before)
            //frame.$castBar.fadeIn(0);
            frame.$castBar.animate({ opacity: 1 }, 0);
        },

        _completeCastBar: function(unit) {
            var frame = this._frameForUnit(unit);

            Game.Clock.clearInterval(CAST_BAR_CLOCK_KEY + '_' + unit.id);

            frame.$castBarProgress.css('width', '100%')
                .removeClass('casting cast-complete cast-canceled')
                .addClass('cast-complete');
            //frame.$castBar.fadeOut(500);
            frame.$castBar.animate({ opacity: 0 }, 500);
        },

        _cancelCastBar: function(unit, message) {
            var frame = this._frameForUnit(unit);

            Game.Clock.clearInterval(CAST_BAR_CLOCK_KEY + '_' + unit.id);

            frame.$castBarProgress.css('width', '100%')
                .removeClass('casting cast-complete cast-canceled')
                .addClass('cast-canceled');
            frame.$castBarText.html(Game.Util.defaultFor(message, 'Failed'));
            //frame.$castBar.fadeOut(500);
            frame.$castBar.animate({ opacity: 0 }, 500);
        }

    };

    Game.UserInterface = new UserInterface();




    /*
     CooldownTimer class:

     Handles radial shading of buttons/effects (to display cooldowns)
     Radial shading code has been adapted from https://codepen.io/jeremywynn/pen/emLjyL

     param clockKey:
         Make sure to give each CooldownTimer a unique clockKey
     param invertShades:
         If true, when cooldown starts the entire canvas will be blank and will slowly become shaded
         If false, when cooldown starts the entire canvas will be shaded and will slowly become unshaded (default)
     */
    var CooldownTimer = function($container, clockKey, invertShades) {
        this._init($container, clockKey, invertShades);
    };
    CooldownTimer.prototype = {
        _init: function($container, clockKey, invertShades) {
            this.$container = $container;
            this.container = this.$container.get(0);
            this.$canvas = this.$container.find('canvas');
            this.canvas = this.$canvas.get(0);
            this.context = this.canvas.getContext('2d');

            this.clockKey = clockKey;
            this.invertShades = invertShades;
        },

        startCooldown: function(totalCooldown, elapsed) {
            var self = this;

            this.endCooldown();

            if (elapsed >= totalCooldown) {
                return; // Don't need to start anything
            }

            // Set up a temporary interval for the spinner that updates at a very high framerate
            Game.Clock.setInterval(this.clockKey, function(iterations, period) {
                elapsed += iterations * period;
                var percentComplete = elapsed / totalCooldown;

                // For debugging:
                //if (percentComplete >= 0.5) {
                //    Game.Clock.clearInterval(self.clockKey);
                //    return;
                //}

                if (Game.Util.roundForComparison(percentComplete) >= 1.0) {
                    self.endCooldown();
                }
                else {
                    self._drawCooldown(percentComplete);
                }
            }, 1.0 / COOLDOWN_UPDATES_PER_SECOND);
        },

        endCooldown: function() {
            Game.Clock.clearInterval(this.clockKey);
            this._clearCanvas();
        },

        _clearCanvas: function() {
            this.context.setTransform(1, 0, 0, 1, 0, 0);

            if (this.invertShades) {
                // Fill context with a shaded grey
                this.context.fillStyle = 'rgba(0, 0, 0, 0.5)';
                this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
            }
            else {
                // Clear all shaded grey
                this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
            }
        },

        _drawCooldown: function(percentComplete) {
            var degrees = 360 * percentComplete;
            var hypotenuse = Math.sqrt(Math.pow(this.container.clientWidth, 2) + Math.pow(this.container.clientHeight, 2));
            var radius = hypotenuse / 2;

            this._clearCanvas();

            this.canvas.height = hypotenuse;
            this.canvas.width = hypotenuse;

            this.canvas.style.marginLeft = -radius + "px";
            this.canvas.style.marginTop = -radius + "px";

            this.context.fillStyle = 'rgba(0, 0, 0, 0.5)';

            this.context.translate(this.canvas.width/2, this.canvas.height/2);

            // Orient context so that 0 degrees is pointing North
            this.context.rotate(-Math.PI/2);

            if (DRAW_COOLDOWN_LINES) {
                // Draw line towards origin (North)
                this.context.beginPath();
                this.context.moveTo(0, 0);
                this.context.lineTo(radius * Math.cos(0).toFixed(15), radius * Math.sin(0).toFixed(15));
                this.context.lineWidth = 2;
                this.context.strokeStyle = 'rgba(255, 255, 255, 0.9)';
                this.context.shadowColor = 'rgba(255, 255, 255, 0.6)';
                this.context.shadowBlur = 10;
                this.context.stroke();

                // Draw line towards degree offset
                this.context.moveTo(0, 0);
                this.context.lineTo(radius * Math.cos(degrees * Math.PI/180).toFixed(15), radius * Math.sin(degrees * Math.PI/180).toFixed(15));
                this.context.stroke();
            }
            else {
                // Not drawing lines, just start at origin
                this.context.beginPath();
                this.context.moveTo(0, 0);
                this.context.stroke();
            }

            // Draw a filled arc
            this.context.shadowColor = null;
            this.context.shadowBlur = null;
            if (this.invertShades) {
                // Draw arc from current spot (degrees * Math.PI/180) counterclockwise towards origin (0)
                this.context.arc(0, 0, radius, degrees * Math.PI/180, 0, true);
            }
            else {
                // Draw arc from current spot (degrees * Math.PI/180) clockwise towards origin (Math.PI*2)
                this.context.arc(0, 0, radius, degrees * Math.PI/180, Math.PI*2, false);
            }
            this.context.fill();
            this.context.closePath();
        }

    };


}(jQuery));
